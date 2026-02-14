import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Import Agents
import { sahaayGenius } from "./agents/genius";

// Export functions to be deployed
export const genius = sahaayGenius;

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
