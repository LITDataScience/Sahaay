import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp(); // Ensure admin is initialized

// Import Agents
import { sahaayGenius } from "./agents/genius";

// Import Services & Schemas
// Import Services & Schemas
import { BookingService } from "./services/BookingService";
import { BookingRequestSchema } from "./schemas/booking";
import { AIService } from "./services/AIService";
import { TypesenseSync } from "./services/TypesenseSync";
import { trpcFunction } from "./router/index";

// Export backend functions to be deployed
export const genius = sahaayGenius;
export const tRPC = trpcFunction;

// User Triggers
export const onUserCreate = functions.auth.user().onCreate((user) => {
    // Basic setup for new users
    return admin.firestore().collection("users").doc(user.uid).set({
        email: user.email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        role: "user", // Default role
        reputationScore: 0
    }, { merge: true });
});

// Callable Functions
export const initiateItemBooking = functions.https.onCall(async (data, context) => {
    // 0. AppCheck Enforcement
    if (context.app == undefined) {
        throw new functions.https.HttpsError(
            'failed-precondition',
            'The function must be called from an App Check verified app.'
        );
    }

    // 1. Authenticate Request
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'User must be logged in to book an item.'
        );
    }

    // 2. Validate Payload with Zod
    const validationResult = BookingRequestSchema.safeParse(data);
    if (!validationResult.success) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Invalid booking payload',
            validationResult.error.format()
        );
    }

    // 3. Execute Service
    try {
        const bookingService = new BookingService();
        const result = await bookingService.createItemBooking(
            validationResult.data,
            context.auth.uid
        );
        return { success: true, data: result };
    } catch (e: any) {
        console.error("Booking Error:", e);
        throw new functions.https.HttpsError('internal', e.message || 'Booking failed');
    }
});

// Typesense Search Replication
export const onItemWrite = functions.firestore.document('items/{itemId}').onWrite(async (change, context) => {
    try {
        await TypesenseSync.handleItemWrite(change, context);
    } catch (e) {
        console.error("Typesense Sync Error:", e);
    }
});

// AI Edge Trigger
export const onItemCreated = functions.firestore.document('items/{itemId}').onCreate(async (snap, context) => {
    const itemData = snap.data();
    try {
        const isSafe = await AIService.moderateListing(itemData);
        if (!isSafe) {
            // Flag for admin intervention and soft-hide the listing
            await snap.ref.update({ status: 'flagged_by_ai' });
        }
    } catch (e) {
        console.error("AI Moderation Error:", e);
    }
});
