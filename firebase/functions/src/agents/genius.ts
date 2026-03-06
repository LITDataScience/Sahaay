import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import cors from "cors";

admin.initializeApp();
const db = admin.firestore();
const corsHandler = cors({ origin: true }) as any;

// Initialize Gemini
// Note: In production, use process.env.GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE");

interface GeniusRequest {
    text?: string;
    imageBase64?: string;
    location: { lat: number; lng: number };
}

export const sahaayGenius = onRequest({
    enforceAppCheck: true,
    maxInstances: 10
}, (req, res) => {
    corsHandler(req, res, async () => {
        try {
            const { text, imageBase64, location } = req.body as GeniusRequest;

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

            if (text) prompt += `\nUser Request: "${text}"`;

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
            } else {
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

        } catch (error) {
            console.error(error);
            res.status(500).send({ error: "Genius is thinking too hard... try again." });
        }
    });
});
