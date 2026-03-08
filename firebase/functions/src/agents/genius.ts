import { onRequest } from "firebase-functions/v2/https";
import cors from "cors";
import { AIProviderService } from "../services/AIProviderService";
import { SearchService } from "../services/SearchService";

const corsHandler = cors({ origin: true }) as any;
const searchService = new SearchService();

interface GeniusRequest {
    text?: string;
    imageBase64?: string;
    location: { lat: number; lng: number };
}

export const sahaayGenius = onRequest({
    maxInstances: 10
}, (req, res) => {
    corsHandler(req, res, async () => {
        try {
            const { text, imageBase64, location } = req.body as GeniusRequest;

            if (!text && !imageBase64) {
                res.status(400).send({ error: "Please provide text or an image." });
                return;
            }

            const fallbackAnalysis = {
                intent: "borrow",
                keywords: text ? text.split(/\s+/).slice(0, 6) : ["nearby", "item"],
                reasoning: "Borrow-side marketplace retrieval is the strongest grounded path available right now.",
                suggestedAction: "Show nearby listings",
            };

            const prompt = `You are Sahaay Genius, a grounded concierge for a hyperlocal marketplace.
User context: location (${location.lat}, ${location.lng}).
User text: "${text || ""}"
Image provided: ${imageBase64 ? "yes" : "no"}

Return JSON only:
{
  "intent": "borrow" | "service",
  "keywords": ["list", "of", "query", "terms"],
  "reasoning": "short reasoning",
  "suggestedAction": "one short action"
}`;

            const analysis = await AIProviderService.generateStructuredObject(prompt, fallbackAnalysis) || fallbackAnalysis;
            const searchQuery = [text, ...(analysis.keywords || [])].filter(Boolean).join(' ');
            const matches = analysis.intent === 'borrow'
                ? await searchService.searchNearbyListings({
                    query: text || '',
                    naturalLanguageIntent: searchQuery,
                    category: 'All',
                    userLat: location.lat,
                    userLng: location.lng,
                    limit: 5,
                    sortIntent: 'balanced',
                    trustPreference: 'balanced',
                })
                : [];

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
