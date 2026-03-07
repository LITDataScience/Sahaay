import * as admin from 'firebase-admin';
import { createMachine, createActor } from 'xstate';
import { BookingRequest } from '../schemas/booking';
import { AMLGraphService } from './AMLGraphService';

// Define the deterministic Escrow State Machine
export const EscrowMachine = createMachine({
    id: 'escrow',
    initial: 'pending',
    states: {
        pending: {
            on: {
                payment_intent_created: 'awaiting_payment',
                cancelled: 'cancelled',
            }
        },
        awaiting_payment: {
            on: {
                payment_succeeded: 'escrow_held',
                payment_failed: 'pending',
                cancelled: 'cancelled',
            }
        },
        escrow_held: {
            on: {
                item_returned: 'completed',
                disputed: 'disputed',
            }
        },
        disputed: {
            on: {
                resolved_refund_borrower: 'refunded',
                resolved_pay_lender: 'completed',
            }
        },
        completed: {
            type: 'final'
        },
        refunded: {
            type: 'final'
        },
        cancelled: {
            type: 'final'
        }
    }
});

export class BookingService {
    private readonly db = admin.firestore();

    /**
     * Creates a new booking using XState determinism and an Idempotency Key
     * to prevent double-billing on network retries.
     */
    async createItemBooking(data: BookingRequest & { idempotencyKey?: string }, borrowerId: string) {
        const itemRef = this.db.collection('items').doc(data.itemId);
        const idempotencyKey = data.idempotencyKey || `bk_ik_${borrowerId}_${data.itemId}_${Date.now()}`;

        return await this.db.runTransaction(async (transaction) => {
            // 1. Idempotency Check
            const idempotencyRef = this.db.collection('idempotency_keys').doc(idempotencyKey);
            const idempotencySnap = await transaction.get(idempotencyRef);

            if (idempotencySnap.exists) {
                const existingData = idempotencySnap.data();
                // If it exists and succeeded previously, return the cached successful result
                return {
                    bookingId: existingData?.bookingId,
                    paymentId: existingData?.paymentId,
                    status: existingData?.status,
                    totalAmount: existingData?.totalAmount
                };
            }

            // 2. Item Availability
            const itemSnap = await transaction.get(itemRef);
            if (!itemSnap.exists) {
                throw new Error("Item does not exist.");
            }

            const itemData = itemSnap.data();
            if (itemData?.status !== 'active') {
                throw new Error("Item is not available for booking.");
            }

            if (itemData?.ownerId === borrowerId) {
                throw new Error("Cannot book your own item.");
            }

            // 3. Time Math
            const start = new Date(data.startDate);
            const end = new Date(data.endDate);
            if (start >= end) {
                throw new Error("End date must be after start date.");
            }

            const diffTime = Math.abs(end.getTime() - start.getTime());
            const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // 4. Price Calculation
            const baseAmount = days * (itemData?.pricePerDay || 0);
            const depositAmount = itemData?.deposit || 0;
            const platformFee = baseAmount * 0.10;
            const totalAmount = baseAmount + depositAmount + platformFee;

            // 4.5. AML Structural Velocity Interdiction
            const isFlagged = await AMLGraphService.evaluateVelocityGraph(itemData?.ownerId, borrowerId, totalAmount);
            if (isFlagged) {
                throw new Error("Transaction blocked due to AML compliance policies (Velocity Violation).");
            }

            // 5. Native State Machine enforcement
            // In XState V5, we persist the full snapshot for rehydration
            const actor = createActor(EscrowMachine).start();
            const initialSnapshot = actor.getPersistedSnapshot();
            const initialStatus = actor.getSnapshot().value;

            const bookingRef = this.db.collection('bookings').doc();

            const bookingDoc = {
                type: 'item',
                itemId: data.itemId,
                borrowerId,
                lenderId: itemData?.ownerId,
                startDate: admin.firestore.Timestamp.fromDate(start),
                endDate: admin.firestore.Timestamp.fromDate(end),
                days,
                baseAmount,
                depositAmount,
                platformFee,
                totalAmount,
                currency: 'INR',
                status: initialStatus, // "pending"
                escrowState: initialSnapshot, // Persistent JSON snapshot
                paymentStatus: 'pending',
                idempotencyKey,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            transaction.set(bookingRef, bookingDoc);

            // 6. Transition State to awaiting_payment manually
            actor.send({ type: 'payment_intent_created' });
            const snapshotAfterIntent = actor.getPersistedSnapshot();
            const statusAfterIntent = actor.getSnapshot().value;

            // Update booking doc with transitioned state
            transaction.update(bookingRef, {
                status: statusAfterIntent,
                escrowState: snapshotAfterIntent,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            const paymentRef = this.db.collection('payments').doc();
            transaction.set(paymentRef, {
                bookingType: 'item',
                bookingId: bookingRef.id,
                payerId: borrowerId,
                payeeId: itemData?.ownerId,
                amount: totalAmount,
                currency: 'INR',
                method: 'upi_intent',
                status: statusAfterIntent, // "awaiting_payment"
                escrow: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // 7. Lock the Idempotency Key
            transaction.set(idempotencyRef, {
                bookingId: bookingRef.id,
                paymentId: paymentRef.id,
                status: statusAfterIntent,
                totalAmount,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            return {
                bookingId: bookingRef.id,
                paymentId: paymentRef.id,
                status: statusAfterIntent,
                totalAmount
            };
        });
    }

    /**
     * Rehydrates a booking from its persistent Firestore snapshot and executes a transition.
     */
    async transitionBooking(bookingId: string, event: any) {
        const bookingRef = this.db.collection('bookings').doc(bookingId);

        return await this.db.runTransaction(async (transaction) => {
            const bookingSnap = await transaction.get(bookingRef);
            if (!bookingSnap.exists) {
                throw new Error("Booking not found.");
            }

            const bookingData = bookingSnap.data();
            const persistedSnapshot = bookingData?.escrowState;

            if (!persistedSnapshot) {
                throw new Error("Critical Failure: Booking has no persistent escrow state.");
            }

            // Rehydrate Actor from Snapshot
            const actor = createActor(EscrowMachine, { snapshot: persistedSnapshot }).start();

            // Execute Transition
            actor.send(event);

            const nextSnapshot = actor.getPersistedSnapshot();
            const nextStatus = actor.getSnapshot().value;

            // Commit new state back to Firestore
            transaction.update(bookingRef, {
                status: nextStatus as string,
                escrowState: nextSnapshot,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            return {
                bookingId,
                previousStatus: bookingData?.status,
                newStatus: nextStatus as string
            };
        });
    }
}
