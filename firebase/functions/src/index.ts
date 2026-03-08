import * as admin from "firebase-admin";
import { onDocumentWritten, onDocumentCreated } from "firebase-functions/v2/firestore";
import { beforeUserCreated } from "firebase-functions/v2/identity";

admin.initializeApp(); // Ensure admin is initialized

// Import Agents
import { sahaayGenius } from "./agents/genius";

// Import Services
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
        reputationScore: 0,
        isVerified: false,
        kycStatus: 'pending',
        verificationStatus: 'not_started',
        verificationReviewNote: '',
    }, { merge: true });
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
        const moderation = await AIService.moderateListing(itemData);
        if (!moderation.safe) {
            // Flag for admin intervention and soft-hide the listing
            await snap.ref.update({
                status: 'flagged_by_ai',
                moderation: {
                    status: 'flagged',
                    labels: moderation.labels,
                    score: moderation.score,
                    summary: moderation.summary,
                },
            });
            return;
        }

        await snap.ref.set({
            moderation: {
                status: 'approved',
                labels: moderation.labels,
                score: moderation.score,
                summary: moderation.summary,
            },
        }, { merge: true });
    } catch (e) {
        console.error("AI Moderation Error:", e);
    }
});
