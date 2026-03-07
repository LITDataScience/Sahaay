import functions from '@react-native-firebase/functions';

export type InitiateBookingPayload = {
    itemId: string;
    startDate: string;
    endDate: string;
};

export type InitiateBookingResponse = {
    success: boolean;
    bookingId: string;
    status: string;
};

export async function initiateBookingRemote(payload: InitiateBookingPayload) {
    const callable = functions().httpsCallable('tRPC');
    const response = await callable({
        path: 'initiateBooking',
        input: payload,
    });

    return response.data as InitiateBookingResponse;
}
