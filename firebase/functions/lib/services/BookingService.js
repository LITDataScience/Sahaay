"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = exports.EscrowMachine = void 0;
const admin = __importStar(require("firebase-admin"));
const xstate_1 = require("xstate");
// Define the deterministic Escrow State Machine
exports.EscrowMachine = (0, xstate_1.createMachine)({
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
class BookingService {
    constructor() {
        this.db = admin.firestore();
    }
    /**
     * Creates a new booking using XState determinism and an Idempotency Key
     * to prevent double-billing on network retries.
     */
    async createItemBooking(data, borrowerId) {
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
                    bookingId: existingData === null || existingData === void 0 ? void 0 : existingData.bookingId,
                    paymentId: existingData === null || existingData === void 0 ? void 0 : existingData.paymentId,
                    status: existingData === null || existingData === void 0 ? void 0 : existingData.status,
                    totalAmount: existingData === null || existingData === void 0 ? void 0 : existingData.totalAmount
                };
            }
            // 2. Item Availability
            const itemSnap = await transaction.get(itemRef);
            if (!itemSnap.exists) {
                throw new Error("Item does not exist.");
            }
            const itemData = itemSnap.data();
            if ((itemData === null || itemData === void 0 ? void 0 : itemData.status) !== 'active') {
                throw new Error("Item is not available for booking.");
            }
            if ((itemData === null || itemData === void 0 ? void 0 : itemData.ownerId) === borrowerId) {
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
            const baseAmount = days * ((itemData === null || itemData === void 0 ? void 0 : itemData.pricePerDay) || 0);
            const depositAmount = (itemData === null || itemData === void 0 ? void 0 : itemData.deposit) || 0;
            const platformFee = baseAmount * 0.10;
            const totalAmount = baseAmount + depositAmount + platformFee;
            // 5. Native State Machine enforcement
            const initialState = exports.EscrowMachine.initialState;
            const bookingRef = this.db.collection('bookings').doc();
            const bookingDoc = {
                type: 'item',
                itemId: data.itemId,
                borrowerId,
                lenderId: itemData === null || itemData === void 0 ? void 0 : itemData.ownerId,
                startDate: admin.firestore.Timestamp.fromDate(start),
                endDate: admin.firestore.Timestamp.fromDate(end),
                days,
                baseAmount,
                depositAmount,
                platformFee,
                totalAmount,
                currency: 'INR',
                status: initialState.value,
                paymentStatus: 'pending',
                idempotencyKey,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            transaction.set(bookingRef, bookingDoc);
            // 6. Transition State to awaiting_payment manually acting as the actor
            const stateAfterIntent = exports.EscrowMachine.transition(initialState, { type: 'payment_intent_created' });
            const paymentRef = this.db.collection('payments').doc();
            transaction.set(paymentRef, {
                bookingType: 'item',
                bookingId: bookingRef.id,
                payerId: borrowerId,
                payeeId: itemData === null || itemData === void 0 ? void 0 : itemData.ownerId,
                amount: totalAmount,
                currency: 'INR',
                method: 'upi_intent',
                status: stateAfterIntent.value,
                escrow: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            // 7. Lock the Idempotency Key
            transaction.set(idempotencyRef, {
                bookingId: bookingRef.id,
                paymentId: paymentRef.id,
                status: stateAfterIntent.value,
                totalAmount,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return {
                bookingId: bookingRef.id,
                paymentId: paymentRef.id,
                status: stateAfterIntent.value,
                totalAmount
            };
        });
    }
}
exports.BookingService = BookingService;
//# sourceMappingURL=BookingService.js.map