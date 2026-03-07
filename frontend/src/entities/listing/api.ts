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
    userLat?: number;
    userLng?: number;
    limit?: number;
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
            userLat: payload.userLat,
            userLng: payload.userLng,
            limit: payload.limit ?? 24,
        },
    });

    return (response.data as { items: PublishedListing[] }).items;
}

export const useCreateListing = () =>
    useMutation({
        mutationFn: createListingRemote,
    });

export const useNearbyListings = (payload: SearchNearbyPayload) =>
    useQuery({
        queryKey: ['nearby-listings', payload],
        queryFn: () => searchNearbyListingsRemote(payload),
        staleTime: 1000 * 60,
    });
