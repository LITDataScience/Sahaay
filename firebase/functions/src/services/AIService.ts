import { AIProviderService } from './AIProviderService';

export type ModerationResult = {
    safe: boolean;
    labels: string[];
    score: number;
    summary: string;
};

export class AIService {
    static async moderateListing(itemData: any): Promise<ModerationResult> {
        const heuristic = heuristicModeration(itemData);

        const prompt = `
You are a strict Trust & Safety AI for a hyperlocal Indian marketplace called Sahaay.
Analyze the listing and return JSON:
{
  "safe": boolean,
  "labels": ["unsafe_image" | "illegal_or_restricted" | "possible_counterfeit" | "unclear_photos" | "missing_critical_details" | "suspicious_claims"],
  "score": number,
  "summary": string
}

Listing title: ${itemData.title || ''}
Listing description: ${itemData.description || ''}
Listing category: ${itemData.category || ''}
Listing price: ${itemData.pricePerDay || itemData.price || 0}
Image count: ${Array.isArray(itemData.images) ? itemData.images.length : 0}
`;

        return await AIProviderService.generateStructuredObject(prompt, heuristic) || heuristic;
    }
}

function heuristicModeration(itemData: any): ModerationResult {
    const content = `${itemData.title || ''} ${itemData.description || ''}`.toLowerCase();
    const labels: string[] = [];

    if (/weapon|gun|pistol|explosive|drugs|contraband/.test(content)) {
        labels.push('illegal_or_restricted');
    }
    if ((itemData.description || '').trim().length < 20) {
        labels.push('missing_critical_details');
    }
    if (!Array.isArray(itemData.images) || itemData.images.length === 0) {
        labels.push('unclear_photos');
    }
    if (/guaranteed profit|no questions asked|unlimited/.test(content)) {
        labels.push('suspicious_claims');
    }

    const safe = !labels.includes('illegal_or_restricted');
    return {
        safe,
        labels,
        score: safe ? Math.max(0.18, labels.length * 0.12) : 0.96,
        summary: safe
            ? labels.length
                ? 'Listing is allowed but should be improved before scaling visibility.'
                : 'Listing passed marketplace safety checks.'
            : 'Listing requires manual intervention due to policy risk.',
    };
}
