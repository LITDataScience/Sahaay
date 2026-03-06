import { initTRPC, TRPCError } from '@trpc/server';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { BookingService } from '../services/BookingService';
import { BookingRequestSchema } from '../schemas/booking';
import { z } from 'zod';
import * as admin from 'firebase-admin';

// Context interface bridging Firebase Auth into tRPC
export interface Context {
    auth?: {
        uid: string;
        token: any;
    };
    app?: any; // AppCheck token
}

// 1. Initialize tRPC
const t = initTRPC.context<Context>().create();

// 2. Define reusable Middlewares (Zero-Trust checks)
const requireAuth = t.middleware(({ ctx, next }) => {
    if (!ctx.auth) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User must be authenticated.' });
    }
    return next({ ctx: { auth: ctx.auth } });
});

const requireAppCheck = t.middleware(({ ctx, next }) => {
    if (ctx.app === undefined) {
        // Enforce AppCheck verify
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Suspicious origin. AppCheck missing.' });
    }
    return next();
});

// Guard procedure combining auth and app check
const guardedProcedure = t.procedure.use(requireAppCheck).use(requireAuth);

// 3. Define the Router
export const appRouter = t.router({
    // Generic Ping
    health: t.procedure.use(requireAppCheck).query(() => {
        return 'Sahaay Engine is alive 🚀';
    }),

    // Payment Status Poller
    paymentStatus: guardedProcedure
        .input(z.object({ bookingId: z.string(), signature: z.string() }))
        .query(async ({ input, ctx }) => {
            const db = admin.firestore();
            const snap = await db.collection('payments').where('bookingId', '==', input.bookingId).limit(1).get();
            if (snap.empty) {
                return { status: 'processing' };
            }
            const payment = snap.docs[0].data();
            return { status: payment.status };
        }),

    // Booking Endpoint enforcing XState and Idempotency
    initiateBooking: guardedProcedure
        .input(BookingRequestSchema)
        .mutation(async ({ input, ctx }) => {
            try {
                const bookingService = new BookingService();

                // Idempotency keys should ideally be passed in the input schema from the client
                // Here we delegate the heavy lifting to our refactored BookingService
                const result = await bookingService.createItemBooking(input, ctx.auth.uid);

                return { success: true, bookingId: result.bookingId, status: result.status };
            } catch (error: any) {
                console.error('tRPC Booking Error:', error);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error.message || 'Escrow initialization failed'
                });
            }
        })
});

// Export type router type signature,
// this is the ONLY thing the Frontend imports, achieving 0kb bundle overhead
export type AppRouter = typeof appRouter;

// 4. Firebase Cloud Function Adapter
export const trpcFunction = onCall({
    enforceAppCheck: true,
    maxInstances: 10
}, async (request) => {
    // tRPC typically operates over HTTP, but we can bridge it over HTTPS Callables 
    // by manually invoking the router. A proper production setup uses trpc-express adapter or similar.
    // For this blueprint, we demonstrate the architectural boundary.
    const caller = appRouter.createCaller({
        auth: request.auth ? { uid: request.auth.uid, token: request.auth.token } : undefined,
        app: request.app
    });

    const data = request.data as any;

    if (data.path === 'initiateBooking') {
        return await caller.initiateBooking(data.input);
    } else if (data.path === 'health') {
        return await caller.health();
    } else if (data.path === 'paymentStatus') {
        return await caller.paymentStatus(data.input);
    }

    throw new HttpsError('not-found', 'tRPC Route not mapped in Callable Edge.');
});
