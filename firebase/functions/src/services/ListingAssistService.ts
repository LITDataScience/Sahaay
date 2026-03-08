import { AIProviderService } from './AIProviderService';

export type ListingDraftAnalysisInput = {
    title?: string;
    description?: string;
    category?: string;
    condition?: 'new' | 'excellent' | 'good' | 'fair';
    images?: string[];
    pricePerDay?: number;
    deposit?: number;
    radiusKm?: number;
    payoutMethod?: 'upi' | 'bank';
    location?: {
        lat?: number;
        lng?: number;
        locality?: string;
        city?: string;
        state?: string;
    };
};

export type ListingDraftAnalysis = {
    titleSuggestions: string[];
    suggestedCategory: string | null;
    suggestedCondition: 'new' | 'excellent' | 'good' | 'fair' | null;
    suggestedPricePerDay: number | null;
    suggestedDeposit: number | null;
    suggestedRadiusKm: number | null;
    readinessScore: number;
    readinessSummary: string;
    warnings: string[];
    marketInsights: string[];
};

const CATEGORY_PRICE_HINTS: Record<string, { price: number; deposit: number; radiusKm: number }> = {
    Electronics: { price: 650, deposit: 2500, radiusKm: 5 },
    Tools: { price: 450, deposit: 1800, radiusKm: 7 },
    Appliances: { price: 700, deposit: 3000, radiusKm: 5 },
    Fashion: { price: 300, deposit: 1200, radiusKm: 3 },
    Sports: { price: 350, deposit: 1500, radiusKm: 6 },
    Travel: { price: 800, deposit: 3500, radiusKm: 10 },
};

export class ListingAssistService {
    async analyzeDraft(input: ListingDraftAnalysisInput): Promise<ListingDraftAnalysis> {
        const heuristic = buildHeuristicAnalysis(input);

        const prompt = `
You are the Sahaay listing copilot. Improve a listing draft for a premium hyperlocal rental marketplace.
Draft:
- title: ${input.title || ''}
- description: ${input.description || ''}
- category: ${input.category || ''}
- condition: ${input.condition || ''}
- pricePerDay: ${input.pricePerDay || 0}
- deposit: ${input.deposit || 0}
- radiusKm: ${input.radiusKm || 0}
- locality: ${input.location?.locality || ''}
- city: ${input.location?.city || ''}

Return concise JSON with:
titleSuggestions, suggestedCategory, suggestedCondition, suggestedPricePerDay, suggestedDeposit, suggestedRadiusKm, readinessScore, readinessSummary, warnings, marketInsights.
`;

        return await AIProviderService.generateStructuredObject(prompt, heuristic) || heuristic;
    }
}

function buildHeuristicAnalysis(input: ListingDraftAnalysisInput): ListingDraftAnalysis {
    const category = input.category || inferCategory(input.title || '', input.description || '');
    const defaults = CATEGORY_PRICE_HINTS[category] || { price: 500, deposit: 2000, radiusKm: 5 };
    const warnings: string[] = [];

    const titleSuggestions = buildTitleSuggestions(input.title || '', category);
    if (!input.images?.length) warnings.push('Add at least one bright, close-up hero photo.');
    if ((input.description || '').trim().length < 40) warnings.push('Expand the description with use cases, included accessories, and condition cues.');
    if (!input.location?.locality) warnings.push('Set a precise locality so nearby ranking stays accurate.');
    if (!input.pricePerDay || input.pricePerDay <= 0) warnings.push('Set a daily price before publishing.');

    const readinessScore = Math.max(15, Math.min(98,
        (input.images?.length ? 20 : 0) +
        ((input.title || '').trim().length >= 6 ? 20 : 0) +
        ((input.description || '').trim().length >= 40 ? 20 : 0) +
        (input.location?.locality ? 15 : 0) +
        (typeof input.pricePerDay === 'number' && input.pricePerDay > 0 ? 15 : 0) +
        (typeof input.deposit === 'number' ? 10 : 0)
    ));

    return {
        titleSuggestions,
        suggestedCategory: category,
        suggestedCondition: input.condition || 'good',
        suggestedPricePerDay: Math.round(input.pricePerDay || defaults.price),
        suggestedDeposit: Math.round(input.deposit || defaults.deposit),
        suggestedRadiusKm: input.radiusKm || defaults.radiusKm,
        readinessScore,
        readinessSummary: readinessScore >= 80
            ? 'This draft feels premium and should convert well once trust cues are clear.'
            : 'The draft is promising, but tightening photos, details, and economics will lift conversion.',
        warnings,
        marketInsights: [
            `Listings in ${category} convert better when the deposit feels proportionate to the daily price.`,
            `A ${input.radiusKm || defaults.radiusKm} km radius is a strong default for ${category.toLowerCase()} in dense local markets.`,
            'Trust cues like accessories, brand name, and exact condition reduce borrower hesitation quickly.',
        ],
    };
}

function inferCategory(title: string, description: string) {
    const haystack = `${title} ${description}`.toLowerCase();
    if (/drill|saw|tool|hammer|ladder/.test(haystack)) return 'Tools';
    if (/camera|laptop|phone|speaker|projector/.test(haystack)) return 'Electronics';
    if (/mixer|fridge|oven|vacuum/.test(haystack)) return 'Appliances';
    if (/jacket|dress|lehenga|fashion/.test(haystack)) return 'Fashion';
    if (/cycle|bat|sports|treadmill/.test(haystack)) return 'Sports';
    if (/bag|suitcase|travel/.test(haystack)) return 'Travel';
    return 'Electronics';
}

function buildTitleSuggestions(title: string, category: string) {
    const clean = title.trim();
    if (clean.length >= 6) {
        return [
            clean,
            `${clean} with trusted local pickup`,
            `${clean} in premium condition`,
        ].slice(0, 3);
    }

    return [
        `${category} ready for local rental`,
        `Premium ${category.toLowerCase()} listing`,
        `${category} with secure pickup`,
    ];
}
