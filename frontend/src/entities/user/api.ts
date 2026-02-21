import { useQuery } from '@tanstack/react-query';
import firestore from '@react-native-firebase/firestore';

export interface UserProfile {
    id: string;
    email: string;
    role: 'user' | 'admin' | 'provider';
    reputationScore: number;
    createdAt: any;
}

export const useGetUserProfile = (uid?: string) => {
    return useQuery({
        queryKey: ['user', uid],
        queryFn: async () => {
            if (!uid) return null;

            const snapshot = await firestore().collection('users').doc(uid).get();
            if (!snapshot.exists) {
                throw new Error('User not found');
            }

            return {
                id: snapshot.id,
                ...(snapshot.data() as Omit<UserProfile, 'id'>)
            };
        },
        enabled: !!uid, // Only run the query if a UID is provided
        staleTime: 1000 * 60 * 15, // 15 mins
    });
};
