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
exports.onItemCreated = exports.onItemWrite = exports.onUserCreate = exports.tRPC = exports.genius = void 0;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-functions/v2/firestore");
const identity_1 = require("firebase-functions/v2/identity");
admin.initializeApp(); // Ensure admin is initialized
// Import Agents
const genius_1 = require("./agents/genius");
// Import Services
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