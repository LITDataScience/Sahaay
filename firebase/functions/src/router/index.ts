import { initTRPC, TRPCError } from '@trpc/server';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { BookingService } from '../services/BookingService';
import { BookingRequestSchema } from '../schemas/booking';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { ListingService } from '../services/ListingService';
import { AnalyzeListingDraftSchema, CreateListingSchema, SearchListingsSchema } from '../schemas/listing';
import { TrustService, TrustedUserProfile } from '../services/TrustService';
import { VerificationService } from '../services/VerificationService';
import { SubmitVerificationSchema, ReviewVerificationSchema } from '../schemas/verification';
import { ListingAssistService } from '../services/ListingAssistService';
import { MarketplaceEventSchema } from '../schemas/event';
import { EventIngestService } from '../services/EventIngestService';
import { RagService } from '../services/RagService';

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

const requireAdmin = t.middleware(async ({ ctx, next }) => {
    if (!ctx.auth) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User must be authenticated.' });
    }

    const snap = await admin.firestore().collection('users').doc(ctx.auth.uid).get();
    const role = snap.data()?.role;
    if (role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin privileges required.' });
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
const adminProcedure = guardedProcedure.use(requireAdmin);

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
                const result = await listingService.createItemListing(input, ctx.auth!.uid);
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

    getItemById: appCheckedProcedure
        .input(z.object({
            itemId: z.string().min(1),
            userLat: z.number().min(-90).max(90).optional(),
            userLng: z.number().min(-180).max(180).optional(),
        }))
        .query(async ({ input }) => {
            try {
                return await new ListingService().getItemById(input.itemId, {
                    userLat: input.userLat,
                    userLng: input.userLng,
                });
            } catch (error: any) {
                console.error('tRPC Item Detail Error:', error);
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: error.message || 'Item detail lookup failed',
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

    analyzeListingDraft: guardedProcedure
        .input(AnalyzeListingDraftSchema)
        .mutation(async ({ input }) => {
            try {
                const assist = new ListingAssistService();
                return await assist.analyzeDraft(input);
            } catch (error: any) {
                console.error('tRPC Listing Assist Error:', error);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error.message || 'Listing analysis failed',
                });
            }
        }),

    submitVerification: guardedProcedure
        .input(SubmitVerificationSchema)
        .mutation(async ({ input, ctx }) => {
            const provider = ctx.auth.token?.firebase?.sign_in_provider;
            if (provider === 'anonymous') {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Secure phone sign-in is required before KYC submission.',
                });
            }

            try {
                const service = new VerificationService();
                return await service.submitVerification(ctx.auth!.uid, input);
            } catch (error: any) {
                console.error('tRPC Submit Verification Error:', error);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error.message || 'Verification submission failed',
                });
            }
        }),

    getVerificationStatus: guardedProcedure
        .query(async ({ ctx }) => {
            try {
                return await new VerificationService().getVerificationStatus(ctx.auth!.uid);
            } catch (error: any) {
                console.error('tRPC Verification Status Error:', error);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error.message || 'Verification status lookup failed',
                });
            }
        }),

    getVerificationReviewQueue: adminProcedure
        .input(z.object({ limit: z.number().int().min(1).max(100).default(25) }).optional())
        .query(async ({ input }) => {
            try {
                return {
                    items: await new VerificationService().listVerificationQueue(input?.limit ?? 25),
                };
            } catch (error: any) {
                console.error('tRPC Verification Queue Error:', error);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error.message || 'Verification review queue failed',
                });
            }
        }),

    reviewVerification: adminProcedure
        .input(ReviewVerificationSchema)
        .mutation(async ({ input, ctx }) => {
            try {
                return await new VerificationService().reviewVerification(
                    ctx.auth!.uid,
                    input.userId,
                    input.decision,
                    input.reviewNote
                );
            } catch (error: any) {
                console.error('tRPC Review Verification Error:', error);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error.message || 'Verification review failed',
                });
            }
        }),

    trackEvent: appCheckedProcedure
        .input(MarketplaceEventSchema)
        .mutation(async ({ input, ctx }) => {
            return await new EventIngestService().track(ctx.auth?.uid || null, input);
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

    getBookingQuote: guardedProcedure
        .input(BookingRequestSchema)
        .query(async ({ input }) => {
            try {
                return await new BookingService().getBookingQuote(input);
            } catch (error: any) {
                console.error('tRPC Booking Quote Error:', error);
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error.message || 'Booking quote failed',
                });
            }
        }),

    // Booking Endpoint enforcing XState and Idempotency
    initiateBooking: trustedPayoutProcedure
        .input(BookingRequestSchema)
        .mutation(async ({ input, ctx }) => {
            try {
                const bookingService = new BookingService();

                // Idempotency keys should ideally be passed in the input schema from the client
                // Here we delegate the heavy lifting to our refactored BookingService
                const result = await bookingService.createItemBooking(input, ctx.auth!.uid);

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
        }),

    askSupportCopilot: appCheckedProcedure
        .input(z.object({ question: z.string().min(3).max(1000) }))
        .query(async ({ input }) => {
            try {
                return await new RagService().answerSupportQuestion(input.question);
            } catch (error: any) {
                console.error('tRPC Support Copilot Error:', error);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error.message || 'Support copilot failed',
                });
            }
        }),

    getOpsCopilotSummary: adminProcedure
        .query(async () => {
            try {
                return await new RagService().buildOpsSummary();
            } catch (error: any) {
                console.error('tRPC Ops Copilot Error:', error);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error.message || 'Ops copilot failed',
                });
            }
        }),
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
    } else if (data.path === 'getBookingQuote') {
        return await caller.getBookingQuote(data.input);
    } else if (data.path === 'createItem') {
        return await caller.createItem(data.input);
    } else if (data.path === 'getItemById') {
        return await caller.getItemById(data.input);
    } else if (data.path === 'searchItemsNearby') {
        return await caller.searchItemsNearby(data.input);
    } else if (data.path === 'analyzeListingDraft') {
        return await caller.analyzeListingDraft(data.input);
    } else if (data.path === 'submitVerification') {
        return await caller.submitVerification(data.input);
    } else if (data.path === 'getVerificationStatus') {
        return await caller.getVerificationStatus();
    } else if (data.path === 'getVerificationReviewQueue') {
        return await caller.getVerificationReviewQueue(data.input);
    } else if (data.path === 'reviewVerification') {
        return await caller.reviewVerification(data.input);
    } else if (data.path === 'trackEvent') {
        return await caller.trackEvent(data.input);
    } else if (data.path === 'askSupportCopilot') {
        return await caller.askSupportCopilot(data.input);
    } else if (data.path === 'getOpsCopilotSummary') {
        return await caller.getOpsCopilotSummary();
    } else if (data.path === 'health') {
        return await caller.health();
    } else if (data.path === 'paymentStatus') {
        return await caller.paymentStatus(data.input);
    }

    throw new HttpsError('not-found', 'tRPC Route not mapped in Callable Edge.');
});
