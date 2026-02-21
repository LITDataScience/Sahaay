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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onItemCreated = exports.onItemWrite = exports.initiateItemBooking = exports.onUserCreate = exports.tRPC = exports.genius = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp(); // Ensure admin is initialized
// Import Agents
const genius_1 = require("./agents/genius");
// Import Services & Schemas
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
exports.onUserCreate = functions.auth.user().onCreate((user) => {
    // Basic setup for new users
    return admin.firestore().collection("users").doc(user.uid).set({
        email: user.email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        role: "user",
        reputationScore: 0
    }, { merge: true });
});
// Callable Functions
exports.initiateItemBooking = functions.https.onCall(async (data, context) => {
    // 0. AppCheck Enforcement
    if (context.app == undefined) {
        throw new functions.https.HttpsError('failed-precondition', 'The function must be called from an App Check verified app.');
    }
    // 1. Authenticate Request
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in to book an item.');
    }
    // 2. Validate Payload with Zod
    const validationResult = booking_1.BookingRequestSchema.safeParse(data);
    if (!validationResult.success) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid booking payload', validationResult.error.format());
    }
    // 3. Execute Service
    try {
        const bookingService = new BookingService_1.BookingService();
        const result = await bookingService.createItemBooking(validationResult.data, context.auth.uid);
        return { success: true, data: result };
    }
    catch (e) {
        console.error("Booking Error:", e);
        throw new functions.https.HttpsError('internal', e.message || 'Booking failed');
    }
});
// Typesense Search Replication
exports.onItemWrite = functions.firestore.document('items/{itemId}').onWrite(async (change, context) => {
    try {
        await TypesenseSync_1.TypesenseSync.handleItemWrite(change, context);
    }
    catch (e) {
        console.error("Typesense Sync Error:", e);
    }
});
// AI Edge Trigger
exports.onItemCreated = functions.firestore.document('items/{itemId}').onCreate(async (snap, context) => {
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