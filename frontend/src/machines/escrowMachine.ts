// SPDX-Header-Start
// SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
// © 2026 Sahaay Technologies Pvt. Ltd. All rights reserved.
// SPDX-Header-End

import { setup, assign } from 'xstate';

export interface EscrowContext {
    bookingId: string | null;
    lenderId: string | null;
    borrowerId: string | null;
    amount: number;
    ipfsHash: string | null;
    error: string | null;
}

export type EscrowEvent =
    | { type: 'INITIATE_BOOKING'; bookingId: string; lenderId: string; borrowerId: string; amount: number }
    | { type: 'PAYMENT_STARTED' }
    | { type: 'PAYMENT_CONFIRMED' }
    | { type: 'PAYMENT_FAILED'; error: string }
    | { type: 'HANDSHAKE_SCANNED'; ipfsHash: string }
    | { type: 'DISPUTE_FILED'; reason: string }
    | { type: 'RETURN_CONFIRMED' };

export const escrowMachine = setup({
    types: {
        context: {} as EscrowContext,
        events: {} as EscrowEvent,
    },
    actions: {
        setBookingDetails: assign({
            bookingId: ({ event }) => (event.type === 'INITIATE_BOOKING' ? event.bookingId : null),
            lenderId: ({ event }) => (event.type === 'INITIATE_BOOKING' ? event.lenderId : null),
            borrowerId: ({ event }) => (event.type === 'INITIATE_BOOKING' ? event.borrowerId : null),
            amount: ({ event }) => (event.type === 'INITIATE_BOOKING' ? event.amount : 0),
            error: null,
        }),
        setPaymentError: assign({
            error: ({ event }) => (event.type === 'PAYMENT_FAILED' ? event.error : 'Unknown Error')
        }),
        setIpfsHash: assign({
            ipfsHash: ({ event }) => (event.type === 'HANDSHAKE_SCANNED' ? event.ipfsHash : null)
        }),
        setDisputeError: assign({
            error: ({ event }) => (event.type === 'DISPUTE_FILED' ? event.reason : null)
        })
    }
}).createMachine({
    id: 'sahaayEscrow',
    initial: 'idle',
    context: {
        bookingId: null,
        lenderId: null,
        borrowerId: null,
        amount: 0,
        ipfsHash: null,
        error: null,
    },
    states: {
        idle: {
            on: {
                INITIATE_BOOKING: {
                    target: 'awaiting_payment',
                    actions: 'setBookingDetails'
                }
            }
        },
        awaiting_payment: {
            on: {
                PAYMENT_STARTED: {
                    target: 'funding_escrow'
                }
            }
        },
        funding_escrow: {
            on: {
                PAYMENT_CONFIRMED: {
                    target: 'ready_for_handover'
                },
                PAYMENT_FAILED: {
                    target: 'awaiting_payment',
                    actions: 'setPaymentError'
                }
            }
        },
        ready_for_handover: {
            on: {
                HANDSHAKE_SCANNED: {
                    target: 'active_rental',
                    actions: 'setIpfsHash'
                }
            }
        },
        active_rental: {
            on: {
                RETURN_CONFIRMED: {
                    target: 'completed'
                },
                DISPUTE_FILED: {
                    target: 'disputed',
                    actions: 'setDisputeError'
                }
            }
        },
        disputed: {
            type: 'final' // Hands off to manual arbitration
        },
        completed: {
            type: 'final' // End of successful lifecycle
        }
    }
});
