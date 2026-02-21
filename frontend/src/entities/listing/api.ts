import { useQuery } from '@tanstack/react-query';
import firestore from '@react-native-firebase/firestore';

export interface Listing {
    id: string;
    title: string;
    description: string;
    pricePerDay: number;
    deposit: number;
    category: string;
    image: string;
    ownerId: string;
    status: 'active' | 'paused' | 'deleted';
    createdAt: number;
}

export const useGetListings = (category: string = 'All') => {
    return useQuery({
        queryKey: ['listings', category],
        queryFn: async () => {
            let queryRef = firestore().collection('items').where('status', '==', 'active');

            if (category !== 'All') {
                queryRef = queryRef.where('category', '==', category.toLowerCase());
            }

            const snapshot = await queryRef.orderBy('createdAt', 'desc').get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...(doc.data() as Omit<Listing, 'id'>)
            }));
        },
        staleTime: 1000 * 60 * 5, // 5 min
    });
};
