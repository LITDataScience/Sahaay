import { useQuery } from '@tanstack/react-query';
import { Client } from 'typesense';
import { Item } from '../../features/listings/ui/ItemCard';

// In an Expo build, these would be managed via EAS Secrets / expo-constants.
const typesenseClient = new Client({
    nodes: [
        {
            host: process.env.EXPO_PUBLIC_TYPESENSE_HOST || 'localhost',
            port: parseInt(process.env.EXPO_PUBLIC_TYPESENSE_PORT || '8108'),
            protocol: process.env.EXPO_PUBLIC_TYPESENSE_PROTOCOL || 'http',
        },
    ],
    apiKey: process.env.EXPO_PUBLIC_TYPESENSE_SEARCH_KEY || 'public-search-key',
    connectionTimeoutSeconds: 2,
});

type NearbySearchOptions = {
    userLat?: number;
    userLng?: number;
};

export const useTypesenseSearch = (query: string, category: string, options: NearbySearchOptions = {}) => {
    return useQuery({
        queryKey: ['itemsSearch', query, category, options.userLat, options.userLng],
        queryFn: async () => {
            // For an empty search, Typesense allows querying with `q='*'` to return everything.
            let q = query.trim() === '' ? '*' : query;

            // Build filter string based on Category if provided
            let filterString = '';
            if (category && category !== 'All') {
                // Assuming we would map category to a specific boolean or array schema natively
                filterString = `category:=${category}`;
            }

            try {
                const searchParameters: any = {
                    q,
                    query_by: 'title,description,category,locality,city',
                    // prefix=true enables instant search as the user types (e.g. "Dr" matches "Drill")
                    prefix: true,
                };

                if (filterString) {
                    searchParameters.filter_by = filterString;
                }

                if (typeof options.userLat === 'number' && typeof options.userLng === 'number') {
                    searchParameters.sort_by = `_geoPoint(${options.userLat}, ${options.userLng}):asc`;
                }

                // Typesense promises sub-10ms response times
                const response = await typesenseClient.collections('items').documents().search(searchParameters);

                // Map the Typesense payload into our FSD Item model
                return (
                    response.hits?.map((hit: any) => ({
                        ...(hit.document as Item),
                        locality: hit.document.locality,
                        distance: hit.document.distance || 'Nearby',
                    })) || []
                );
            } catch (error) {
                console.error("Typesense Query Error:", error);
                // Fail gracefully, return empty results
                return [];
            }
        },
        // We leverage React Query's built in stale matching to cache rapid typo search changes natively
        staleTime: 1000 * 60 * 5,
    });
};
