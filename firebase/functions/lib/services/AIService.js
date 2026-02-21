"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const generative_ai_1 = require("@google/generative-ai");
// In production, this should be fetched securely from Google Cloud Secret Manager or Firebase parameters
const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
class AIService {
    static async moderateListing(itemData) {
        if (!apiKey) {
            console.warn('Gemini API key not set in environment, skipping strict moderation.');
            return true; // Fail open if no key for local dev
        }
        try {
            // Using the robust generalized 1.5-pro model for complex text/image pattern analysis
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
            const prompt = `
                You are a strict Trust & Safety AI for a hyperlocal Indian marketplace called "Sahaay".
                Analyze the following item listing for any potential fraud, illegal contraband, weapons, or terms of service violations.
                Return ONLY the exact word "PASS" if the listing is safe.
                Return ONLY the exact word "FAIL" if the listing is unsafe.
                
                Listing Title: ${itemData.title || ''}
                Listing Description: ${itemData.description || ''}
                Listing Price: ${itemData.price || ''}
            `;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().trim().toUpperCase();
            if (text.includes("FAIL")) {
                console.warn(`Listing flagged by Gemini AI: ${itemData.title}`);
                return false;
            }
            return true;
        }
        catch (error) {
            console.error('Error generating AI moderation content:', error);
            // Default to manual review (fail-safe) if AI throws an error
            return false;
        }
    }
}
exports.AIService = AIService;
//# sourceMappingURL=AIService.js.map