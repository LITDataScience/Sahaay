import * as admin from 'firebase-admin';
import { CreateListingInput, SearchListingsInput } from '../schemas/listing';
import { SearchService } from './SearchService';
import { TrustService } from './TrustService';

type SearchResult = {
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
    distance: string;
    locality: string;
    city: string;
    state: string;
    payoutMethod: string;
    status: string;
    createdAt: number;
};

export class ListingService {
    private readonly db = admin.firestore();
    private readonly trustService = new TrustService();
    private readonly searchService = new SearchService();

    async createItemListing(input: CreateListingInput, ownerId: string) {
        const userData = await this.trustService.assertPayoutEligibleUser(ownerId);
        const itemRef = this.db.collection('items').doc();

        const platformFeePct = 10;
        const lenderPayoutPct = 90;
        const estimatedLenderNetPerDay = Math.max(0, Math.round(input.pricePerDay * 0.9));

        const listingDoc = {
            title: input.title,
            description: input.description,
            category: input.category,
            condition: input.condition,
            images: input.images,
            image: input.images[0],
            price: input.pricePerDay,
            pricePerDay: input.pricePerDay,
            deposit: input.deposit,
            ownerId,
            ownerName: userData?.name || 'Trusted lender',
            status: 'active',
            visibility: {
                mode: 'radius',
                radiusKm: input.radiusKm,
                center: input.location,
            },
            radiusKm: input.radiusKm,
            locality: input.location.locality,
            city: input.location.city,
            state: input.location.state,
            location: new admin.firestore.GeoPoint(input.location.lat, input.location.lng),
            pricing: {
                pricePerDay: input.pricePerDay,
                deposit: input.deposit,
                platformFeePct,
                lenderPayoutPct,
                estimatedLenderNetPerDay,
            },
            payoutConfig: {
                payoutEligible: userData?.isVerified === true,
                payoutMethod: input.payoutMethod,
                beneficiaryId: userData?.beneficiaryId || null,
                settlementPreference: 'instant',
            },
            verificationLevel: userData?.isVerified ? 'verified' : 'pending',
            trustScore: userData?.isVerified ? 0.92 : 0.45,
            moderation: {
                status: 'pending',
                labels: [],
                score: 0,
                summary: 'Awaiting AI review.',
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await itemRef.set(listingDoc);

        return {
            id: itemRef.id,
            ...listingDoc,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
    }

    async searchItemsNearby(input: SearchListingsInput): Promise<SearchResult[]> {
        return await this.searchService.searchNearbyListings(input) as unknown as SearchResult[];
    }

    async getItemById(itemId: string, userLocation?: { userLat?: number; userLng?: number }) {
        const itemSnap = await this.db.collection('items').doc(itemId).get();
        if (!itemSnap.exists) {
            throw new Error('Listing not found.');
        }

        const data = itemSnap.data() || {};
        const point = data.location as admin.firestore.GeoPoint | undefined;
        const distanceKm =
            point && typeof userLocation?.userLat === 'number' && typeof userLocation?.userLng === 'number'
                ? haversineKm(userLocation.userLat, userLocation.userLng, point.latitude, point.longitude)
                : null;

        const similarItems = await this.searchService.searchNearbyListings({
            query: data.category || data.title || '',
            category: data.category || 'All',
            sortIntent: 'balanced',
            trustPreference: 'balanced',
            userLat: userLocation?.userLat,
            userLng: userLocation?.userLng,
            limit: 6,
        });

        return {
            id: itemSnap.id,
            title: data.title,
            description: data.description,
            category: data.category,
            condition: data.condition,
            image: data.image,
            images: data.images || [],
            price: data.pricePerDay ?? data.price ?? 0,
            pricePerDay: data.pricePerDay ?? data.price ?? 0,
            deposit: data.deposit ?? 0,
            radiusKm: data.radiusKm ?? data.visibility?.radiusKm ?? 0,
            owner: data.ownerName || 'Trusted lender',
            ownerId: data.ownerId,
            locality: data.locality || '',
            city: data.city || '',
            state: data.state || '',
            payoutMethod: data.payoutConfig?.payoutMethod || 'upi',
            status: data.status || 'active',
            createdAt: data.createdAt?.toMillis?.() || Date.now(),
            distance: distanceKm !== null ? `${distanceKm.toFixed(1)} km` : 'Nearby',
            trustScore: Number(data.trustScore ?? 0.45),
            verificationLevel: data.verificationLevel || (data.payoutConfig?.payoutEligible ? 'verified' : 'pending'),
            matchReasons: [
                data.payoutConfig?.payoutEligible ? 'Trusted verified owner' : 'Identity review in progress',
                distanceKm !== null && distanceKm <= 3 ? 'Fast nearby pickup' : 'Local discovery match',
            ],
            aiSummary: data.moderation?.summary || 'This listing is active in nearby discovery.',
            similarItems: similarItems.filter((item) => item.id !== itemId).slice(0, 3),
        };
    }
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
