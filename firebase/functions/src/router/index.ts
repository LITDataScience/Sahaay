import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import * as functions from 'firebase-functions';
import { BookingService } from '../services/BookingService';
import { BookingRequestSchema } from '../schemas/booking';

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
    health: t.procedure.query(() => {
        return 'Sahaay Engine is alive 🚀';
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
export const trpcFunction = functions.https.onCall(async (data, context) => {
    // tRPC typically operates over HTTP, but we can bridge it over HTTPS Callables 
    // by manually invoking the router. A proper production setup uses trpc-express adapter or similar.
    // For this blueprint, we demonstrate the architectural boundary.
    const caller = appRouter.createCaller({
        auth: context.auth ? { uid: context.auth.uid, token: context.auth.token } : undefined,
        app: context.app
    });

    if (data.path === 'initiateBooking') {
        return await caller.initiateBooking(data.input);
    } else if (data.path === 'health') {
        return await caller.health();
    }

    throw new functions.https.HttpsError('not-found', 'tRPC Route not mapped in Callable Edge.');
});
