import AsyncStorage from '@react-native-async-storage/async-storage';
import { PublishedListing } from './types';

const LOCAL_PUBLISHED_LISTINGS_KEY = '@sahaay_local_published_listings';

export async function getLocalPublishedListings(): Promise<PublishedListing[]> {
    const raw = await AsyncStorage.getItem(LOCAL_PUBLISHED_LISTINGS_KEY);

    if (!raw) {
        return [];
    }

    try {
        return JSON.parse(raw) as PublishedListing[];
    } catch {
        return [];
    }
}

export async function saveLocalPublishedListing(listing: PublishedListing): Promise<void> {
    const listings = await getLocalPublishedListings();
    const next = [listing, ...listings.filter((item) => item.id !== listing.id)];
    await AsyncStorage.setItem(LOCAL_PUBLISHED_LISTINGS_KEY, JSON.stringify(next));
}
