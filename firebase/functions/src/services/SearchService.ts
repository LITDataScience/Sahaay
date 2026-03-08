import * as admin from 'firebase-admin';
import { Client } from 'typesense';
import { SearchListingsInput } from '../schemas/listing';

type SearchCandidate = {
    id: string;
    title: string;
    description: string;
    category: string;
    condition: string;
    image: string;
    images: string[];
    price: number;
    pricePerDay: number;
    deposit: number;
    radiusKm: number;
    owner: string;
    ownerId: string;
    locality: string;
    city: string;
    state: string;
    payoutMethod: string;
    status: string;
    createdAt: number;
    verificationLevel: 'verified' | 'pending';
    trustScore: number;
    valueScore: number;
    distanceKm: number | null;
    semanticScore: number;
    rankScore: number;
    matchReasons: string[];
    aiSummary: string;
};

const typesenseClient = new Client({
    nodes: [
        {
            host: process.env.TYPESENSE_HOST || 'localhost',
            port: parseInt(process.env.TYPESENSE_PORT || '8108'),
            protocol: process.env.TYPESENSE_PROTOCOL || 'http',
        },
    ],
    apiKey: process.env.TYPESENSE_ADMIN_KEY || 'xyz',
    connectionTimeoutSeconds: 5,
});

export class SearchService {
    private readonly db = admin.firestore();

    async searchNearbyListings(input: SearchListingsInput) {
        const candidates = await this.fetchCandidates(input);

        return candidates
            .map((candidate) => this.rankCandidate(candidate, input))
            .sort((left, right) => right.rankScore - left.rankScore)
            .slice(0, input.limit)
            .map((item) => ({
                id: item.id,
                title: item.title,
                description: item.description,
                category: item.category,
                condition: item.condition,
                image: item.image,
                images: item.images,
                price: item.price,
                pricePerDay: item.pricePerDay,
                deposit: item.deposit,
                radiusKm: item.radiusKm,
                owner: item.owner,
                ownerId: item.ownerId,
                distance: item.distanceKm !== null ? `${item.distanceKm.toFixed(1)} km` : 'Nearby',
                locality: item.locality,
                city: item.city,
                state: item.state,
                payoutMethod: item.payoutMethod,
                status: item.status,
                createdAt: item.createdAt,
                verificationLevel: item.verificationLevel,
                trustScore: item.trustScore,
                valueScore: item.valueScore,
                semanticScore: item.semanticScore,
                rankScore: item.rankScore,
                matchReasons: item.matchReasons,
                aiSummary: item.aiSummary,
            }));
    }

    private async fetchCandidates(input: SearchListingsInput): Promise<SearchCandidate[]> {
        try {
            const searchParameters: Record<string, unknown> = {
                q: input.naturalLanguageIntent?.trim() || input.query || '*',
                query_by: 'title,description,category,locality,city,state',
                per_page: Math.min((input.limit || 24) * 3, 60),
                sort_by: typeof input.userLat === 'number' && typeof input.userLng === 'number'
                    ? `_geoPoint(${input.userLat}, ${input.userLng}):asc`
                    : 'createdAt:desc',
            };

            const filters: string[] = ['status:=active'];
            if (input.category && input.category !== 'All') {
                filters.push(`category:=${input.category}`);
            }
            if (typeof input.budgetMax === 'number') {
                filters.push(`pricePerDay:<=${Math.max(0, input.budgetMax)}`);
            }
            if (typeof input.depositMax === 'number') {
                filters.push(`deposit:<=${Math.max(0, input.depositMax)}`);
            }
            searchParameters.filter_by = filters.join(' && ');

            const response = await typesenseClient.collections('items').documents().search(searchParameters);
            const hits = (response.hits || []) as Array<{ document: Record<string, any> }>;
            return hits.map((hit) => this.normalizeCandidate(hit.document, input));
        } catch (error) {
            console.warn('Typesense retrieval failed, falling back to Firestore search.', error);
            return this.fetchFromFirestore(input);
        }
    }

    private async fetchFromFirestore(input: SearchListingsInput): Promise<SearchCandidate[]> {
        const snapshot = await this.db
            .collection('items')
            .where('status', '==', 'active')
            .orderBy('createdAt', 'desc')
            .limit(100)
            .get();

        return snapshot.docs
            .map((doc) => this.normalizeCandidate({ id: doc.id, ...doc.data() }, input))
            .filter((candidate) => this.matchesHardFilters(candidate, input));
    }

    private normalizeCandidate(document: Record<string, any>, input: SearchListingsInput): SearchCandidate {
        const title = String(document.title || 'Untitled item');
        const description = String(document.description || '');
        const pricePerDay = Number(document.pricePerDay ?? document.price ?? 0);
        const deposit = Number(document.deposit ?? 0);
        const point = normalizeLocation(document.location);
        const distanceKm =
            point && typeof input.userLat === 'number' && typeof input.userLng === 'number'
                ? haversineKm(input.userLat, input.userLng, point.lat, point.lng)
                : null;

        return {
            id: String(document.id),
            title,
            description,
            category: String(document.category || 'Misc'),
            condition: String(document.condition || 'good'),
            image: String(document.image || document.images?.[0] || 'https://via.placeholder.com/400'),
            images: Array.isArray(document.images) ? document.images : [],
            price: pricePerDay,
            pricePerDay,
            deposit,
            radiusKm: Number(document.radiusKm || document.visibility?.radiusKm || 0),
            owner: String(document.ownerName || document.owner || 'Trusted lender'),
            ownerId: String(document.ownerId || ''),
            locality: String(document.locality || ''),
            city: String(document.city || ''),
            state: String(document.state || ''),
            payoutMethod: String(document.payoutMethod || document.payoutConfig?.payoutMethod || 'upi'),
            status: String(document.status || 'active'),
            createdAt: toMillis(document.createdAt),
            verificationLevel: document.payoutConfig?.payoutEligible === true || document.verificationLevel === 'verified'
                ? 'verified'
                : 'pending',
            trustScore: Number(document.trustScore || (document.payoutConfig?.payoutEligible ? 0.9 : 0.45)),
            valueScore: 0,
            distanceKm,
            semanticScore: keywordScore([input.query, input.naturalLanguageIntent].filter(Boolean).join(' '), title, description),
            rankScore: 0,
            matchReasons: [],
            aiSummary: '',
        };
    }

    private matchesHardFilters(candidate: SearchCandidate, input: SearchListingsInput) {
        const query = (input.query || '').trim().toLowerCase();
        const intent = (input.naturalLanguageIntent || '').trim().toLowerCase();
        const haystack = `${candidate.title} ${candidate.description} ${candidate.category} ${candidate.locality} ${candidate.city}`.toLowerCase();
        const matchesCategory = !input.category || input.category === 'All' || candidate.category === input.category;
        const matchesBudget = typeof input.budgetMax !== 'number' || candidate.pricePerDay <= input.budgetMax;
        const matchesDeposit = typeof input.depositMax !== 'number' || candidate.deposit <= input.depositMax;
        const matchesQuery = (!query && !intent) || haystack.includes(query) || haystack.includes(intent);
        const withinRadius = candidate.distanceKm === null || candidate.distanceKm <= (candidate.radiusKm || Number.MAX_SAFE_INTEGER);

        return matchesCategory && matchesBudget && matchesDeposit && matchesQuery && withinRadius;
    }

    private rankCandidate(candidate: SearchCandidate, input: SearchListingsInput) {
        const priceCap = typeof input.budgetMax === 'number' && input.budgetMax > 0 ? input.budgetMax : Math.max(candidate.pricePerDay, 1);
        const depositCap = typeof input.depositMax === 'number' && input.depositMax > 0 ? input.depositMax : Math.max(candidate.deposit, 1);
        const distanceScore = candidate.distanceKm === null ? 0.4 : Math.max(0, 1 - Math.min(candidate.distanceKm / Math.max(candidate.radiusKm || 10, 1), 1));
        const priceScore = Math.max(0, 1 - candidate.pricePerDay / (priceCap * 1.25));
        const depositScore = Math.max(0, 1 - candidate.deposit / Math.max(depositCap * 1.25, 1));
        const freshnessScore = Math.max(0, 1 - (Date.now() - candidate.createdAt) / (1000 * 60 * 60 * 24 * 30));
        const trustWeight = input.trustPreference === 'most_trusted' ? 0.35 : 0.2;
        const distanceWeight = input.sortIntent === 'nearest' ? 0.35 : 0.2;
        const valueWeight = input.sortIntent === 'best_value' ? 0.35 : 0.2;
        const semanticWeight = candidate.semanticScore > 0 ? 0.25 : 0.1;

        const valueScore = Number(((priceScore * 0.65) + (depositScore * 0.35)).toFixed(3));
        const rankScore = Number((
            candidate.trustScore * trustWeight +
            distanceScore * distanceWeight +
            valueScore * valueWeight +
            candidate.semanticScore * semanticWeight +
            freshnessScore * 0.1
        ).toFixed(3));

        const matchReasons: string[] = [];
        if (candidate.trustScore >= 0.8) matchReasons.push('Highest trust');
        if (valueScore >= 0.75) matchReasons.push('Best value nearby');
        if (candidate.distanceKm !== null && candidate.distanceKm <= 3) matchReasons.push('Closest fit for your task');
        if (typeof input.depositMax === 'number' && candidate.deposit <= input.depositMax) matchReasons.push('Lower deposit');
        if (matchReasons.length === 0) matchReasons.push('Well-matched nearby option');

        return {
            ...candidate,
            valueScore,
            rankScore,
            matchReasons: Array.from(new Set(matchReasons)).slice(0, 3),
            aiSummary: buildAiSummary(candidate, valueScore),
        };
    }
}

function normalizeLocation(location: any): { lat: number; lng: number } | null {
    if (!location) return null;
    if (Array.isArray(location) && location.length >= 2) {
        return { lat: Number(location[0]), lng: Number(location[1]) };
    }
    if (typeof location.latitude === 'number' && typeof location.longitude === 'number') {
        return { lat: location.latitude, lng: location.longitude };
    }
    if (typeof location.lat === 'number' && typeof location.lng === 'number') {
        return { lat: location.lat, lng: location.lng };
    }
    return null;
}

function keywordScore(query: string, title: string, description: string) {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return 0.4;

    const haystack = `${title} ${description}`.toLowerCase();
    const hits = tokens.filter((token) => haystack.includes(token)).length;
    return Number((hits / tokens.length).toFixed(3));
}

function buildAiSummary(candidate: SearchCandidate, valueScore: number) {
    if (candidate.trustScore >= 0.8 && valueScore >= 0.7) {
        return 'Strong trust signals with solid value for a nearby borrower.';
    }
    if (candidate.distanceKm !== null && candidate.distanceKm <= 3) {
        return 'Convenient nearby option for a fast handover.';
    }
    if (valueScore >= 0.75) {
        return 'Good economics for budget-conscious borrowing.';
    }
    return 'Balanced option based on locality, trust, and pricing.';
}

function toMillis(value: any) {
    return typeof value?.toMillis === 'function' ? value.toMillis() : Date.now();
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
}
