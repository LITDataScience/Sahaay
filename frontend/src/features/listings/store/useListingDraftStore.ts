import { create } from 'zustand';
import { ListingDraft, ListingLocation, ListingPayoutMethod, ListingCondition } from '../types';

type ListingDraftState = ListingDraft & {
    setField: <K extends keyof ListingDraft>(field: K, value: ListingDraft[K]) => void;
    setLocation: (location: ListingLocation) => void;
    addImage: (uri: string) => void;
    removeImage: (uri: string) => void;
    reset: () => void;
};

const initialDraft: ListingDraft = {
    title: '',
    description: '',
    category: 'Electronics',
    condition: 'excellent',
    images: [],
    pricePerDay: '',
    deposit: '',
    radiusKm: 5,
    payoutMethod: 'upi',
    location: null,
};

export const useListingDraftStore = create<ListingDraftState>((set) => ({
    ...initialDraft,
    setField: (field, value) => set({ [field]: value } as unknown as Partial<ListingDraftState>),
    setLocation: (location) => set({ location }),
    addImage: (uri) =>
        set((state) => ({
            images: state.images.includes(uri) ? state.images : [...state.images, uri].slice(0, 6),
        })),
    removeImage: (uri) => set((state) => ({ images: state.images.filter((image) => image !== uri) })),
    reset: () => set(initialDraft),
}));

export const setDraftCondition = (condition: ListingCondition) =>
    useListingDraftStore.getState().setField('condition', condition);

export const setDraftPayoutMethod = (payoutMethod: ListingPayoutMethod) =>
    useListingDraftStore.getState().setField('payoutMethod', payoutMethod);
