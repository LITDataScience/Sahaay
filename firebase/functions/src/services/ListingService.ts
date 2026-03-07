import * as admin from 'firebase-admin';
import { CreateListingInput, SearchListingsInput } from '../schemas/listing';
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
        const snapshot = await this.db
            .collection('items')
            .where('status', '==', 'active')
            .orderBy('createdAt', 'desc')
            .limit(100)
            .get();

        const query = input.query.trim().toLowerCase();

        return snapshot.docs
            .map((doc) => {
                const data = doc.data();
                const point = data.location as admin.firestore.GeoPoint | undefined;
                const distanceKm =
                    point && typeof input.userLat === 'number' && typeof input.userLng === 'number'
                        ? haversineKm(input.userLat, input.userLng, point.latitude, point.longitude)
                        : null;

                return {
                    id: doc.id,
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
                    distance: distanceKm !== null ? `${distanceKm.toFixed(1)} km` : 'Nearby',
                    locality: data.locality || '',
                    city: data.city || '',
                    state: data.state || '',
                    payoutMethod: data.payoutConfig?.payoutMethod || 'upi',
                    status: data.status,
                    createdAt: data.createdAt?.toMillis?.() || Date.now(),
                    _distanceKm: distanceKm,
                };
            })
            .filter((item) => {
                const matchesCategory = input.category === 'All' || item.category === input.category;
                const matchesQuery =
                    query.length === 0 ||
                    item.title.toLowerCase().includes(query) ||
                    item.description.toLowerCase().includes(query);
                const withinRadius =
                    item._distanceKm === null || item._distanceKm <= (item.radiusKm || Number.MAX_SAFE_INTEGER);

                return matchesCategory && matchesQuery && withinRadius;
            })
            .sort((a, b) => {
                const leftDistance = a._distanceKm ?? Number.MAX_SAFE_INTEGER;
                const rightDistance = b._distanceKm ?? Number.MAX_SAFE_INTEGER;
                return leftDistance - rightDistance;
            })
            .slice(0, input.limit)
            .map(({ _distanceKm, ...item }) => item);
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
