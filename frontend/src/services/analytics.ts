import AsyncStorage from '@react-native-async-storage/async-storage';
import functions from '@react-native-firebase/functions';

const ANALYTICS_QUEUE_KEY = '@sahaay_marketplace_event_queue';

type MarketplaceEvent = {
    name: string;
    entityId?: string;
    entityType?: string;
    metadata?: Record<string, unknown>;
    occurredAt?: number;
};

export async function trackMarketplaceEvent(event: MarketplaceEvent) {
    const queued = await readQueue();
    queued.push({
        ...event,
        occurredAt: event.occurredAt ?? Date.now(),
    });
    await AsyncStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(queued.slice(-50)));
    await flushMarketplaceEvents();
}

export async function flushMarketplaceEvents() {
    const queue = await readQueue();
    if (queue.length === 0) {
        return;
    }

    const callable = functions().httpsCallable('tRPC');
    const remaining: MarketplaceEvent[] = [];

    for (const event of queue) {
        try {
            await callable({
                path: 'trackEvent',
                input: event,
            });
        } catch {
            remaining.push(event);
        }
    }

    await AsyncStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(remaining));
}

async function readQueue() {
    const raw = await AsyncStorage.getItem(ANALYTICS_QUEUE_KEY);
    if (!raw) {
        return [] as MarketplaceEvent[];
    }

    try {
        return JSON.parse(raw) as MarketplaceEvent[];
    } catch {
        return [] as MarketplaceEvent[];
    }
}
