import { useMutation, useQuery } from '@tanstack/react-query';
import functions from '@react-native-firebase/functions';
import { PublishedListing } from '../../features/listings/types';

export type CreateListingPayload = {
    title: string;
    description: string;
    category: string;
    condition: 'new' | 'excellent' | 'good' | 'fair';
    images: string[];
    pricePerDay: number;
    deposit: number;
    radiusKm: number;
    payoutMethod: 'upi' | 'bank';
    location: {
        lat: number;
        lng: number;
        locality: string;
        city: string;
        state: string;
    };
};

export type SearchNearbyPayload = {
    query?: string;
    category?: string;
    budgetMax?: number;
    depositMax?: number;
    desiredStartDate?: string;
    desiredEndDate?: string;
    sortIntent?: 'balanced' | 'nearest' | 'best_value';
    trustPreference?: 'balanced' | 'most_trusted';
    naturalLanguageIntent?: string;
    userLat?: number;
    userLng?: number;
    limit?: number;
};

export type AnalyzeListingDraftPayload = Partial<CreateListingPayload>;

export type BookingQuotePayload = {
    itemId: string;
    startDate: string;
    endDate: string;
};

export async function createListingRemote(payload: CreateListingPayload) {
    const callable = functions().httpsCallable('tRPC');
    const response = await callable({
        path: 'createItem',
        input: payload,
    });

    return (response.data as { success: boolean; item: PublishedListing }).item;
}

export async function searchNearbyListingsRemote(payload: SearchNearbyPayload) {
    const callable = functions().httpsCallable('tRPC');
    const response = await callable({
        path: 'searchItemsNearby',
        input: {
            query: payload.query ?? '',
            category: payload.category ?? 'All',
            budgetMax: payload.budgetMax,
            depositMax: payload.depositMax,
            desiredStartDate: payload.desiredStartDate,
            desiredEndDate: payload.desiredEndDate,
            sortIntent: payload.sortIntent ?? 'balanced',
            trustPreference: payload.trustPreference ?? 'balanced',
            naturalLanguageIntent: payload.naturalLanguageIntent ?? payload.query ?? '',
            userLat: payload.userLat,
            userLng: payload.userLng,
            limit: payload.limit ?? 24,
        },
    });

    return (response.data as { items: PublishedListing[] }).items;
}

export async function getItemDetailRemote(payload: { itemId: string; userLat?: number; userLng?: number }) {
    const callable = functions().httpsCallable('tRPC');
    const response = await callable({
        path: 'getItemById',
        input: payload,
    });

    return response.data as PublishedListing;
}

export async function analyzeListingDraftRemote(payload: AnalyzeListingDraftPayload) {
    const callable = functions().httpsCallable('tRPC');
    const response = await callable({
        path: 'analyzeListingDraft',
        input: payload,
    });

    return response.data as {
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
}

export async function getBookingQuoteRemote(payload: BookingQuotePayload) {
    const callable = functions().httpsCallable('tRPC');
    const response = await callable({
        path: 'getBookingQuote',
        input: payload,
    });

    return response.data as {
        itemId: string;
        days: number;
        baseAmount: number;
        depositAmount: number;
        platformFee: number;
        totalAmount: number;
        currency: string;
        availabilityStatus: string;
        lenderId: string;
    };
}

export const useCreateListing = () =>
    useMutation({
        mutationFn: createListingRemote,
    });

export const useAnalyzeListingDraft = (payload: AnalyzeListingDraftPayload, enabled = true) =>
    useQuery({
        queryKey: ['listing-analysis', payload],
        queryFn: () => analyzeListingDraftRemote(payload),
        enabled,
        staleTime: 1000 * 30,
    });

export const useNearbyListings = (payload: SearchNearbyPayload) =>
    useQuery({
        queryKey: ['nearby-listings', payload],
        queryFn: () => searchNearbyListingsRemote(payload),
        staleTime: 1000 * 60,
    });

export const useItemDetail = (payload: { itemId: string; userLat?: number; userLng?: number }, enabled = true) =>
    useQuery({
        queryKey: ['item-detail', payload],
        queryFn: () => getItemDetailRemote(payload),
        enabled,
        staleTime: 1000 * 60,
    });
