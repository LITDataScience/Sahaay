import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentWritten, onDocumentCreated } from "firebase-functions/v2/firestore";
import { beforeUserCreated } from "firebase-functions/v2/identity";

admin.initializeApp(); // Ensure admin is initialized

// Import Agents
import { sahaayGenius } from "./agents/genius";

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
export const onUserCreate = beforeUserCreated(async (event) => {
    const user = event.data;
    if (!user) return;
    await admin.firestore().collection("users").doc(user.uid).set({
        email: user.email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        role: "user", // Default role
        reputationScore: 0
    }, { merge: true });
});

// Callable Functions
export const initiateItemBooking = onCall(async (request) => {
    // 0. AppCheck Enforcement
    if (request.app == undefined) {
        throw new HttpsError(
            'failed-precondition',
            'The function must be called from an App Check verified app.'
        );
    }

    // 1. Authenticate Request
    if (!request.auth) {
        throw new HttpsError(
            'unauthenticated',
            'User must be logged in to book an item.'
        );
    }

    // 2. Validate Payload with Zod
    const validationResult = BookingRequestSchema.safeParse(request.data);
    if (!validationResult.success) {
        throw new HttpsError(
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
            request.auth.uid
        );
        return { success: true, data: result };
    } catch (e: any) {
        console.error("Booking Error:", e);
        throw new HttpsError('internal', e.message || 'Booking failed');
    }
});

// Typesense Search Replication
export const onItemWrite = onDocumentWritten('items/{itemId}', async (event) => {
    try {
        await TypesenseSync.handleItemWrite(event);
    } catch (e) {
        console.error("Typesense Sync Error:", e);
    }
});

// AI Edge Trigger
export const onItemCreated = onDocumentCreated('items/{itemId}', async (event) => {
    const snap = event.data;
    if (!snap) return;
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
