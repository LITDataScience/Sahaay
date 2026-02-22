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
exports.onItemCreated = exports.onItemWrite = exports.initiateItemBooking = exports.onUserCreate = exports.tRPC = exports.genius = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const identity_1 = require("firebase-functions/v2/identity");
admin.initializeApp(); // Ensure admin is initialized
// Import Agents
const genius_1 = require("./agents/genius");
// Import Services & Schemas
const BookingService_1 = require("./services/BookingService");
const booking_1 = require("./schemas/booking");
const AIService_1 = require("./services/AIService");
const TypesenseSync_1 = require("./services/TypesenseSync");
const index_1 = require("./router/index");
// Export backend functions to be deployed
exports.genius = genius_1.sahaayGenius;
exports.tRPC = index_1.trpcFunction;
// User Triggers
exports.onUserCreate = (0, identity_1.beforeUserCreated)(async (event) => {
    const user = event.data;
    if (!user)
        return;
    await admin.firestore().collection("users").doc(user.uid).set({
        email: user.email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        role: "user", // Default role
        reputationScore: 0
    }, { merge: true });
});
// Callable Functions
exports.initiateItemBooking = (0, https_1.onCall)(async (request) => {
    // 0. AppCheck Enforcement
    if (request.app == undefined) {
        throw new https_1.HttpsError('failed-precondition', 'The function must be called from an App Check verified app.');
    }
    // 1. Authenticate Request
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be logged in to book an item.');
    }
    // 2. Validate Payload with Zod
    const validationResult = booking_1.BookingRequestSchema.safeParse(request.data);
    if (!validationResult.success) {
        throw new https_1.HttpsError('invalid-argument', 'Invalid booking payload', validationResult.error.format());
    }
    // 3. Execute Service
    try {
        const bookingService = new BookingService_1.BookingService();
        const result = await bookingService.createItemBooking(validationResult.data, request.auth.uid);
        return { success: true, data: result };
    }
    catch (e) {
        console.error("Booking Error:", e);
        throw new https_1.HttpsError('internal', e.message || 'Booking failed');
    }
});
// Typesense Search Replication
exports.onItemWrite = (0, firestore_1.onDocumentWritten)('items/{itemId}', async (event) => {
    try {
        await TypesenseSync_1.TypesenseSync.handleItemWrite(event);
    }
    catch (e) {
        console.error("Typesense Sync Error:", e);
    }
});
// AI Edge Trigger
exports.onItemCreated = (0, firestore_1.onDocumentCreated)('items/{itemId}', async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const itemData = snap.data();
    try {
        const isSafe = await AIService_1.AIService.moderateListing(itemData);
        if (!isSafe) {
            // Flag for admin intervention and soft-hide the listing
            await snap.ref.update({ status: 'flagged_by_ai' });
        }
    }
    catch (e) {
        console.error("AI Moderation Error:", e);
    }
});
//# sourceMappingURL=index.js.map