"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trpcFunction = exports.appRouter = void 0;
const server_1 = require("@trpc/server");
const https_1 = require("firebase-functions/v2/https");
const BookingService_1 = require("../services/BookingService");
const booking_1 = require("../schemas/booking");
// 1. Initialize tRPC
const t = server_1.initTRPC.context().create();
// 2. Define reusable Middlewares (Zero-Trust checks)
const requireAuth = t.middleware(({ ctx, next }) => {
    if (!ctx.auth) {
        throw new server_1.TRPCError({ code: 'UNAUTHORIZED', message: 'User must be authenticated.' });
    }
    return next({ ctx: { auth: ctx.auth } });
});
const requireAppCheck = t.middleware(({ ctx, next }) => {
    if (ctx.app === undefined) {
        // Enforce AppCheck verify
        throw new server_1.TRPCError({ code: 'FORBIDDEN', message: 'Suspicious origin. AppCheck missing.' });
    }
    return next();
});
// Guard procedure combining auth and app check
const guardedProcedure = t.procedure.use(requireAppCheck).use(requireAuth);
// 3. Define the Router
exports.appRouter = t.router({
    // Generic Ping
    health: t.procedure.query(() => {
        return 'Sahaay Engine is alive 🚀';
    }),
    // Booking Endpoint enforcing XState and Idempotency
    initiateBooking: guardedProcedure
        .input(booking_1.BookingRequestSchema)
        .mutation(async ({ input, ctx }) => {
        try {
            const bookingService = new BookingService_1.BookingService();
            // Idempotency keys should ideally be passed in the input schema from the client
            // Here we delegate the heavy lifting to our refactored BookingService
            const result = await bookingService.createItemBooking(input, ctx.auth.uid);
            return { success: true, bookingId: result.bookingId, status: result.status };
        }
        catch (error) {
            console.error('tRPC Booking Error:', error);
            throw new server_1.TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: error.message || 'Escrow initialization failed'
            });
        }
    })
});
// 4. Firebase Cloud Function Adapter
exports.trpcFunction = (0, https_1.onCall)(async (request) => {
    // tRPC typically operates over HTTP, but we can bridge it over HTTPS Callables 
    // by manually invoking the router. A proper production setup uses trpc-express adapter or similar.
    // For this blueprint, we demonstrate the architectural boundary.
    const caller = exports.appRouter.createCaller({
        auth: request.auth ? { uid: request.auth.uid, token: request.auth.token } : undefined,
        app: request.app
    });
    const data = request.data;
    if (data.path === 'initiateBooking') {
        return await caller.initiateBooking(data.input);
    }
    else if (data.path === 'health') {
        return await caller.health();
    }
    throw new https_1.HttpsError('not-found', 'tRPC Route not mapped in Callable Edge.');
});
//# sourceMappingURL=index.js.map