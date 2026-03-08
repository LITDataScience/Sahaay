import * as admin from 'firebase-admin';

export type MarketplaceEventInput = {
    name: string;
    entityId?: string;
    entityType?: string;
    metadata?: Record<string, unknown>;
    occurredAt?: number;
};

export class EventIngestService {
    private readonly db = admin.firestore();

    async track(userId: string | null, event: MarketplaceEventInput) {
        const ref = this.db.collection('marketplace_events').doc();
        await ref.set({
            userId: userId || null,
            name: event.name,
            entityId: event.entityId || null,
            entityType: event.entityType || null,
            metadata: event.metadata || {},
            occurredAt: event.occurredAt
                ? admin.firestore.Timestamp.fromMillis(event.occurredAt)
                : admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return { accepted: true };
    }
}
