import { GoogleGenerativeAI } from '@google/generative-ai';

type ProviderResult<T> = T | null;

export class AIProviderService {
    private static readonly apiKey = process.env.GEMINI_API_KEY || '';
    private static readonly genAI = AIProviderService.apiKey
        ? new GoogleGenerativeAI(AIProviderService.apiKey)
        : null;

    static get isConfigured() {
        return Boolean(AIProviderService.genAI);
    }

    static async generateStructuredObject<T>(prompt: string, fallback: T): Promise<ProviderResult<T>> {
        if (!AIProviderService.genAI) {
            return fallback;
        }

        try {
            const model = AIProviderService.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const result = await model.generateContent(`${prompt}\n\nReturn JSON only.`);
            const response = await result.response;
            const text = response.text().replace(/```json|```/g, '').trim();
            return JSON.parse(text) as T;
        } catch (error) {
            console.warn('Structured provider call failed, falling back to heuristic response.', error);
            return fallback;
        }
    }

    static async generateText(prompt: string, fallback: string): Promise<string> {
        if (!AIProviderService.genAI) {
            return fallback;
        }

        try {
            const model = AIProviderService.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text().trim() || fallback;
        } catch (error) {
            console.warn('Text provider call failed, falling back to heuristic response.', error);
            return fallback;
        }
    }
}
