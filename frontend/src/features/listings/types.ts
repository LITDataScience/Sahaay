export type ListingCondition = 'new' | 'excellent' | 'good' | 'fair';
export type ListingPayoutMethod = 'upi' | 'bank';

export type ListingLocation = {
    lat: number;
    lng: number;
    locality: string;
    city: string;
    state: string;
};

export type ListingDraft = {
    title: string;
    description: string;
    category: string;
    condition: ListingCondition;
    images: string[];
    pricePerDay: string;
    deposit: string;
    radiusKm: number;
    payoutMethod: ListingPayoutMethod;
    location: ListingLocation | null;
};

export type PublishedListing = {
    id: string;
    title: string;
    description: string;
    category: string;
    condition: ListingCondition;
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
    payoutMethod: ListingPayoutMethod;
    createdAt: number;
    status: 'active';
};

export const LISTING_CATEGORIES = [
    'Electronics',
    'Tools',
    'Appliances',
    'Fashion',
    'Sports',
    'Travel',
] as const;

export const LISTING_CONDITIONS: ListingCondition[] = ['new', 'excellent', 'good', 'fair'];
export const LISTING_RADIUS_OPTIONS = [1, 3, 5, 10, 20, 30] as const;
