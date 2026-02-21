import { useMutation } from '@tanstack/react-query';
import functions from '@react-native-firebase/functions';

export interface BookingPayload {
    itemId: string;
    startDate: string; // ISO string
    endDate: string; // ISO string
}

export const useCreateItemBooking = () => {
    return useMutation({
        mutationFn: async (payload: BookingPayload) => {
            const initiateItemBooking = functions().httpsCallable('initiateItemBooking');
            const response = await initiateItemBooking(payload);
            return response.data;
        },
    });
};
