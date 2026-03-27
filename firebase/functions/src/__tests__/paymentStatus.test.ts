import { afterEach, describe, expect, it, vi } from 'vitest';
import * as admin from 'firebase-admin';
import { appRouter } from '../router/index';

type BookingDoc = {
    borrowerId: string;
    lenderId: string;
    paymentStatus?: string;
    status?: string;
};

function createFirestoreMock(bookingDoc?: BookingDoc | null, paymentDoc?: Record<string, unknown> | null) {
    return {
        collection: vi.fn((name: string) => {
            if (name === 'bookings') {
                return {
                    doc: vi.fn(() => ({
                        get: vi.fn(async () => ({
                            exists: Boolean(bookingDoc),
                            data: () => bookingDoc ?? undefined,
                        })),
                    })),
                };
            }

            if (name === 'payments') {
                return {
                    where: vi.fn(() => ({
                        limit: vi.fn(() => ({
                            get: vi.fn(async () => ({
                                empty: !paymentDoc,
                                docs: paymentDoc ? [{ data: () => paymentDoc }] : [],
                            })),
                        })),
                    })),
                };
            }

            throw new Error(`Unexpected collection requested in test: ${name}`);
        }),
    };
}

describe('paymentStatus', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns processing for the borrower while payment is still awaiting confirmation', async () => {
        vi.spyOn(admin, 'firestore').mockReturnValue(
            createFirestoreMock(
                {
                    borrowerId: 'borrower_1',
                    lenderId: 'lender_1',
                    paymentStatus: 'pending',
                    status: 'awaiting_payment',
                },
                { status: 'awaiting_payment' }
            ) as any
        );

        const caller = appRouter.createCaller({
            auth: { uid: 'borrower_1', token: {} },
            app: 'mock-app-check',
        });

        await expect(caller.paymentStatus({ bookingId: 'booking_1' })).resolves.toEqual({ status: 'processing' });
    });

    it('allows the lender to see a successful payment state', async () => {
        vi.spyOn(admin, 'firestore').mockReturnValue(
            createFirestoreMock(
                {
                    borrowerId: 'borrower_1',
                    lenderId: 'lender_1',
                    paymentStatus: 'escrow_held',
                    status: 'escrow_held',
                },
                { status: 'escrow_held' }
            ) as any
        );

        const caller = appRouter.createCaller({
            auth: { uid: 'lender_1', token: {} },
            app: 'mock-app-check',
        });

        await expect(caller.paymentStatus({ bookingId: 'booking_1' })).resolves.toEqual({ status: 'success' });
    });

    it('returns failed when the booking falls back to a failed payment state', async () => {
        vi.spyOn(admin, 'firestore').mockReturnValue(
            createFirestoreMock(
                {
                    borrowerId: 'borrower_1',
                    lenderId: 'lender_1',
                    paymentStatus: 'payment_failed',
                    status: 'pending',
                },
                null
            ) as any
        );

        const caller = appRouter.createCaller({
            auth: { uid: 'borrower_1', token: {} },
            app: 'mock-app-check',
        });

        await expect(caller.paymentStatus({ bookingId: 'booking_1' })).resolves.toEqual({ status: 'failed' });
    });

    it('hides booking state from unrelated users', async () => {
        vi.spyOn(admin, 'firestore').mockReturnValue(
            createFirestoreMock(
                {
                    borrowerId: 'borrower_1',
                    lenderId: 'lender_1',
                    paymentStatus: 'awaiting_payment',
                    status: 'awaiting_payment',
                },
                { status: 'awaiting_payment' }
            ) as any
        );

        const caller = appRouter.createCaller({
            auth: { uid: 'outsider_1', token: {} },
            app: 'mock-app-check',
        });

        await expect(caller.paymentStatus({ bookingId: 'booking_1' })).rejects.toThrow('Booking not found.');
    });

    it('returns not found when the booking does not exist', async () => {
        vi.spyOn(admin, 'firestore').mockReturnValue(createFirestoreMock(null, null) as any);

        const caller = appRouter.createCaller({
            auth: { uid: 'borrower_1', token: {} },
            app: 'mock-app-check',
        });

        await expect(caller.paymentStatus({ bookingId: 'booking_1' })).rejects.toThrow('Booking not found.');
    });
});
