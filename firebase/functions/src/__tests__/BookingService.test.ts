import { describe, it, expect } from 'vitest';
import { EscrowMachine } from '../services/BookingService';
import { initialTransition, transition } from 'xstate';
import { BookingRequestSchema, ServiceBookingRequestSchema } from '../schemas/booking';

/**
 * BookingService Test Suite
 *
 * Tests the deterministic XState Escrow State Machine transitions,
 * Zod schema validation, and edge cases for the booking flow.
 */

// ─── XState Escrow Machine Tests ─────────────────────────────────────────────

describe('EscrowMachine — State Transitions', () => {
    it('should start in the "pending" state', () => {
        const [initialState] = initialTransition(EscrowMachine);
        expect(initialState.value).toBe('pending');
    });

    it('should transition pending → awaiting_payment on payment_intent_created', () => {
        const [initialState] = initialTransition(EscrowMachine);
        const [next] = transition(EscrowMachine, initialState, { type: 'payment_intent_created' });
        expect(next.value).toBe('awaiting_payment');
    });

    it('should transition awaiting_payment → escrow_held on payment_succeeded', () => {
        const [s1] = initialTransition(EscrowMachine);
        const [s2] = transition(EscrowMachine, s1, { type: 'payment_intent_created' });
        const [s3] = transition(EscrowMachine, s2, { type: 'payment_succeeded' });
        expect(s3.value).toBe('escrow_held');
    });

    it('should transition escrow_held → completed on item_returned', () => {
        const [s1] = initialTransition(EscrowMachine);
        const [s2] = transition(EscrowMachine, s1, { type: 'payment_intent_created' });
        const [s3] = transition(EscrowMachine, s2, { type: 'payment_succeeded' });
        const [s4] = transition(EscrowMachine, s3, { type: 'item_returned' });
        expect(s4.value).toBe('completed');
    });

    it('should transition escrow_held → disputed on disputed event', () => {
        const [s1] = initialTransition(EscrowMachine);
        const [s2] = transition(EscrowMachine, s1, { type: 'payment_intent_created' });
        const [s3] = transition(EscrowMachine, s2, { type: 'payment_succeeded' });
        const [s4] = transition(EscrowMachine, s3, { type: 'disputed' });
        expect(s4.value).toBe('disputed');
    });

    it('should transition disputed → refunded on resolved_refund_borrower', () => {
        const [s1] = initialTransition(EscrowMachine);
        const [s2] = transition(EscrowMachine, s1, { type: 'payment_intent_created' });
        const [s3] = transition(EscrowMachine, s2, { type: 'payment_succeeded' });
        const [s4] = transition(EscrowMachine, s3, { type: 'disputed' });
        const [s5] = transition(EscrowMachine, s4, { type: 'resolved_refund_borrower' });
        expect(s5.value).toBe('refunded');
    });

    it('should transition disputed → completed on resolved_pay_lender', () => {
        const [s1] = initialTransition(EscrowMachine);
        const [s2] = transition(EscrowMachine, s1, { type: 'payment_intent_created' });
        const [s3] = transition(EscrowMachine, s2, { type: 'payment_succeeded' });
        const [s4] = transition(EscrowMachine, s3, { type: 'disputed' });
        const [s5] = transition(EscrowMachine, s4, { type: 'resolved_pay_lender' });
        expect(s5.value).toBe('completed');
    });

    it('should remain in pending if cancelled from pending', () => {
        const [s1] = initialTransition(EscrowMachine);
        const [s2] = transition(EscrowMachine, s1, { type: 'cancelled' });
        expect(s2.value).toBe('cancelled');
    });

    it('should transition awaiting_payment → pending on payment_failed', () => {
        const [s1] = initialTransition(EscrowMachine);
        const [s2] = transition(EscrowMachine, s1, { type: 'payment_intent_created' });
        const [s3] = transition(EscrowMachine, s2, { type: 'payment_failed' });
        expect(s3.value).toBe('pending');
    });

    it('completed should be a final state (no outbound transitions)', () => {
        const [s1] = initialTransition(EscrowMachine);
        const [s2] = transition(EscrowMachine, s1, { type: 'payment_intent_created' });
        const [s3] = transition(EscrowMachine, s2, { type: 'payment_succeeded' });
        const [s4] = transition(EscrowMachine, s3, { type: 'item_returned' });
        // Sending any event to a final state should not change it
        const [s5] = transition(EscrowMachine, s4, { type: 'payment_intent_created' });
        expect(s5.value).toBe('completed');
    });

    it('refunded should be a final state', () => {
        const [s1] = initialTransition(EscrowMachine);
        const [s2] = transition(EscrowMachine, s1, { type: 'payment_intent_created' });
        const [s3] = transition(EscrowMachine, s2, { type: 'payment_succeeded' });
        const [s4] = transition(EscrowMachine, s3, { type: 'disputed' });
        const [s5] = transition(EscrowMachine, s4, { type: 'resolved_refund_borrower' });
        const [s6] = transition(EscrowMachine, s5, { type: 'payment_intent_created' });
        expect(s6.value).toBe('refunded');
    });

    it('should complete the full happy-path lifecycle', () => {
        const [s1] = initialTransition(EscrowMachine);
        expect(s1.value).toBe('pending');

        const [s2] = transition(EscrowMachine, s1, { type: 'payment_intent_created' });
        expect(s2.value).toBe('awaiting_payment');

        const [s3] = transition(EscrowMachine, s2, { type: 'payment_succeeded' });
        expect(s3.value).toBe('escrow_held');

        const [s4] = transition(EscrowMachine, s3, { type: 'item_returned' });
        expect(s4.value).toBe('completed');
    });
});

// ─── XState Persistence & Rehydration Tests ──────────────────────────────────

import { createActor } from 'xstate';

describe('EscrowMachine — Persistence & Rehydration', () => {
    it('should serialize and rehydrate the initial state', () => {
        const actor = createActor(EscrowMachine).start();
        const snapshot = actor.getPersistedSnapshot();

        expect(snapshot).toBeDefined();
        expect(actor.getSnapshot().value).toBe('pending');

        // Rehydrate in a new actor
        const newActor = createActor(EscrowMachine, { snapshot }).start();
        expect(newActor.getSnapshot().value).toBe('pending');
    });

    it('should rehydrate into a mid-lifecycle state (escrow_held)', () => {
        const actor = createActor(EscrowMachine).start();
        actor.send({ type: 'payment_intent_created' });
        actor.send({ type: 'payment_succeeded' });

        const snapshot = actor.getPersistedSnapshot();
        expect(actor.getSnapshot().value).toBe('escrow_held');

        // Rehydrate
        const rehydratedActor = createActor(EscrowMachine, { snapshot }).start();
        expect(rehydratedActor.getSnapshot().value).toBe('escrow_held');

        // Continue transition from rehydrated state
        rehydratedActor.send({ type: 'item_returned' });
        expect(rehydratedActor.getSnapshot().value).toBe('completed');
    });
});

// ─── Zod Schema Validation Tests ─────────────────────────────────────────────

describe('BookingRequestSchema — Validation', () => {
    it('should accept a valid booking request', () => {
        const valid = {
            itemId: 'item_abc123',
            startDate: '2026-04-01T10:00:00Z',
            endDate: '2026-04-03T10:00:00Z',
        };
        const result = BookingRequestSchema.safeParse(valid);
        expect(result.success).toBe(true);
    });

    it('should reject an empty itemId', () => {
        const invalid = {
            itemId: '',
            startDate: '2026-04-01T10:00:00Z',
            endDate: '2026-04-03T10:00:00Z',
        };
        const result = BookingRequestSchema.safeParse(invalid);
        expect(result.success).toBe(false);
    });

    it('should reject missing fields', () => {
        const result = BookingRequestSchema.safeParse({});
        expect(result.success).toBe(false);
    });

    it('should reject invalid date formats', () => {
        const invalid = {
            itemId: 'item_abc',
            startDate: 'not-a-date',
            endDate: '2026-04-03T10:00:00Z',
        };
        const result = BookingRequestSchema.safeParse(invalid);
        expect(result.success).toBe(false);
    });
});

describe('ServiceBookingRequestSchema — Validation', () => {
    it('should accept a valid service booking request', () => {
        const valid = {
            serviceId: 'svc_xyz',
            scheduledAt: '2026-04-01T10:00:00Z',
            durationHours: 3,
            address: {
                line1: '123 MG Road',
                city: 'Bengaluru',
                state: 'Karnataka',
                pincode: '560001',
            },
        };
        const result = ServiceBookingRequestSchema.safeParse(valid);
        expect(result.success).toBe(true);
    });

    it('should reject a zero or negative durationHours', () => {
        const invalid = {
            serviceId: 'svc_xyz',
            scheduledAt: '2026-04-01T10:00:00Z',
            durationHours: 0,
            address: {
                line1: '123 MG Road',
                city: 'Bengaluru',
                state: 'Karnataka',
                pincode: '560001',
            },
        };
        const result = ServiceBookingRequestSchema.safeParse(invalid);
        expect(result.success).toBe(false);
    });

    it('should reject invalid pincode length', () => {
        const invalid = {
            serviceId: 'svc_xyz',
            scheduledAt: '2026-04-01T10:00:00Z',
            durationHours: 2,
            address: {
                line1: '123 MG Road',
                city: 'Bengaluru',
                state: 'Karnataka',
                pincode: '1234', // too short
            },
        };
        const result = ServiceBookingRequestSchema.safeParse(invalid);
        expect(result.success).toBe(false);
    });
});
