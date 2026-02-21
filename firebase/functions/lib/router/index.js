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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.trpcFunction = exports.appRouter = void 0;
const server_1 = require("@trpc/server");
const functions = __importStar(require("firebase-functions"));
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
exports.trpcFunction = functions.https.onCall(async (data, context) => {
    // tRPC typically operates over HTTP, but we can bridge it over HTTPS Callables 
    // by manually invoking the router. A proper production setup uses trpc-express adapter or similar.
    // For this blueprint, we demonstrate the architectural boundary.
    const caller = exports.appRouter.createCaller({
        auth: context.auth ? { uid: context.auth.uid, token: context.auth.token } : undefined,
        app: context.app
    });
    if (data.path === 'initiateBooking') {
        return await caller.initiateBooking(data.input);
    }
    else if (data.path === 'health') {
        return await caller.health();
    }
    throw new functions.https.HttpsError('not-found', 'tRPC Route not mapped in Callable Edge.');
});
//# sourceMappingURL=index.js.map