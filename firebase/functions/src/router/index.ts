import { initTRPC, TRPCError } from '@trpc/server';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { BookingService } from '../services/BookingService';
import { BookingRequestSchema } from '../schemas/booking';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { ListingService } from '../services/ListingService';
import { CreateListingSchema, SearchListingsSchema } from '../schemas/listing';
import { TrustService, TrustedUserProfile } from '../services/TrustService';

// Context interface bridging Firebase Auth into tRPC
export interface Context {
    auth?: {
        uid: string;
        token: any;
    };
    app?: any; // AppCheck token
    trustedUser?: TrustedUserProfile;
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

const requireTrustedPayoutIdentity = t.middleware(async ({ ctx, next }) => {
    if (!ctx.auth) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User must be authenticated.' });
    }

    const signInProvider = ctx.auth.token?.firebase?.sign_in_provider;
    if (signInProvider === 'anonymous') {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Complete secure phone sign-in before publishing listings or booking items.',
        });
    }

    try {
        const trustedUser = await new TrustService().assertPayoutEligibleUser(ctx.auth.uid);
        return next({ ctx: { ...ctx, trustedUser } });
    } catch (error) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: error instanceof Error ? error.message : 'Trusted identity required for payout flows.',
        });
    }
});

// Guard procedure combining auth and app check
const guardedProcedure = t.procedure.use(requireAppCheck).use(requireAuth);
const trustedPayoutProcedure = guardedProcedure.use(requireTrustedPayoutIdentity);
const appCheckedProcedure = t.procedure.use(requireAppCheck);

// 3. Define the Router
export const appRouter = t.router({
    // Generic Ping
    health: t.procedure.use(requireAppCheck).query(() => {
        return 'Sahaay Engine is alive 🚀';
    }),

    createItem: trustedPayoutProcedure
        .input(CreateListingSchema)
        .mutation(async ({ input, ctx }) => {
            try {
                const listingService = new ListingService();
                const result = await listingService.createItemListing(input, ctx.auth.uid);
                return { success: true, item: result };
            } catch (error: any) {
                if (error instanceof TRPCError) {
                    throw error;
                }
                console.error('tRPC Create Listing Error:', error);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error.message || 'Listing creation failed',
                });
            }
        }),

    searchItemsNearby: appCheckedProcedure
        .input(SearchListingsSchema)
        .query(async ({ input }) => {
            try {
                const listingService = new ListingService();
                const items = await listingService.searchItemsNearby(input);
                return { items };
            } catch (error: any) {
                console.error('tRPC Nearby Search Error:', error);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error.message || 'Nearby item search failed',
                });
            }
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
    initiateBooking: trustedPayoutProcedure
        .input(BookingRequestSchema)
        .mutation(async ({ input, ctx }) => {
            try {
                const bookingService = new BookingService();

                // Idempotency keys should ideally be passed in the input schema from the client
                // Here we delegate the heavy lifting to our refactored BookingService
                const result = await bookingService.createItemBooking(input, ctx.auth.uid);

                return { success: true, bookingId: result.bookingId, status: result.status };
            } catch (error: any) {
                if (error instanceof TRPCError) {
                    throw error;
                }
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
    } else if (data.path === 'createItem') {
        return await caller.createItem(data.input);
    } else if (data.path === 'searchItemsNearby') {
        return await caller.searchItemsNearby(data.input);
    } else if (data.path === 'health') {
        return await caller.health();
    } else if (data.path === 'paymentStatus') {
        return await caller.paymentStatus(data.input);
    }

    throw new HttpsError('not-found', 'tRPC Route not mapped in Callable Edge.');
});
