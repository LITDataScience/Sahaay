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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sahaayGenius = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const generative_ai_1 = require("@google/generative-ai");
const cors_1 = __importDefault(require("cors"));
admin.initializeApp();
const db = admin.firestore();
const corsHandler = (0, cors_1.default)({ origin: true });
// Initialize Gemini
// Note: In production, use process.env.GEMINI_API_KEY
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE");
exports.sahaayGenius = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            const { text, imageBase64, location } = req.body;
            if (!text && !imageBase64) {
                res.status(400).send({ error: "Please provide text or an image." });
                return;
            }
            // 1. Understand Intent with Gemini
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            let prompt = `You are Sahaay Genius, a helpful assistant for a hyperlocal marketplace. 
            User Context: Location (${location.lat}, ${location.lng}).
            
            Task: Analyze the user's problem and suggest solutions from these categories:
            - Borrow Item (Tools, Medical, Party, Electronics)
            - Book Service (Plumber, Electrician, Cleaner, Carpenter)
            
            Return JSON only:
            {
                "intent": "borrow" | "service",
                "keywords": ["list", "of", "search", "terms"],
                "reasoning": "Quick explanation",
                "suggestedAction": "Rent a Drill" | "Book a Plumber"
            }`;
            if (text)
                prompt += `\nUser Request: "${text}"`;
            const imageParts = imageBase64 ? [{ inlineData: { data: imageBase64, mimeType: "image/jpeg" } }] : [];
            const result = await model.generateContent([prompt, ...imageParts]);
            const response = result.response;
            const analysis = JSON.parse(response.text().replace(/```json|```/g, "").trim());
            // 2. Query Firestore based on keywords
            // Basic implementation: search by category/keyword matching
            // Production: would use vector search extension
            let matches = [];
            if (analysis.intent === "borrow") {
                const snapshot = await db.collection("items")
                    .where("status", "==", "active")
                    .limit(5)
                    .get();
                // Client-side filtering for keywords would happen here or use specialized search service (Algolia/Typesense)
                matches = snapshot.docs.map(d => d.data());
            }
            else {
                const snapshot = await db.collection("services")
                    .where("status", "==", "active")
                    .limit(5)
                    .get();
                matches = snapshot.docs.map(d => d.data());
            }
            res.status(200).send({
                analysis,
                recommendations: matches
            });
        }
        catch (error) {
            console.error(error);
            res.status(500).send({ error: "Genius is thinking too hard... try again." });
        }
    });
});
//# sourceMappingURL=genius.js.map