import { Client } from 'typesense';
import { FirestoreEvent, Change } from 'firebase-functions/v2/firestore';
import { DocumentSnapshot } from 'firebase-admin/firestore';

// Connect to the Typesense Cloud or Local Docker cluster
// In production, fetch keys from Secret Manager
const typesenseClient = new Client({
    nodes: [
        {
            host: process.env.TYPESENSE_HOST || 'localhost',
            port: parseInt(process.env.TYPESENSE_PORT || '8108'),
            protocol: process.env.TYPESENSE_PROTOCOL || 'http'
        }
    ],
    apiKey: process.env.TYPESENSE_ADMIN_KEY || 'xyz',
    connectionTimeoutSeconds: 5
});

/**
 * Syncs Firestore Item mutations to the Typesense cluster automatically.
 */
export class TypesenseSync {
    static async handleItemWrite(
        event: FirestoreEvent<Change<DocumentSnapshot> | undefined, { itemId: string }>
    ) {
        const itemId = event.params.itemId;
        const change = event.data;
        if (!change) return;

        // If the document was deleted
        if (!change.after.exists) {
            console.log(`Deleting item ${itemId} from Typesense`);
            try {
                await typesenseClient.collections('items').documents(itemId).delete();
            } catch (err: any) {
                console.error(`Error deleting item ${itemId} from Typesense:`, err.message);
            }
            return;
        }

        const data = change.after.data();
        if (!data) return;

        // Only index safe items if using AI Moderation
        if (data.status === 'flagged_by_ai') {
            console.log(`Removing flagged item ${itemId} from Typesense`);
            try {
                await typesenseClient.collections('items').documents(itemId).delete();
            } catch (err: any) {
                console.error(`Error removing flagged item ${itemId} from Typesense:`, err.message);
            }
            return;
        }

        const document = {
            id: itemId,
            title: data.title,
            description: data.description,
            category: data.category,
            condition: data.condition,
            price: data.pricePerDay || data.price,
            pricePerDay: data.pricePerDay || data.price,
            deposit: data.deposit,
            ownerId: data.ownerId,
            ownerName: data.ownerName || 'Trusted lender',
            locality: data.locality || '',
            city: data.city || '',
            state: data.state || '',
            radiusKm: data.radiusKm || data.visibility?.radiusKm || 0,
            payoutMethod: data.payoutConfig?.payoutMethod || 'upi',
            verificationLevel: data.verificationLevel || (data.payoutConfig?.payoutEligible ? 'verified' : 'pending'),
            trustScore: data.trustScore ?? (data.payoutConfig?.payoutEligible ? 0.92 : 0.45),
            moderationLabels: data.moderation?.labels || [],
            moderationScore: data.moderation?.score || 0,
            aiSummary: data.moderation?.summary || '',
            location: data.location
                ? [data.location.latitude, data.location.longitude]
                : null,
            createdAt: data.createdAt?.toMillis() || Date.now()
        };

        try {
            console.log(`Upserting item ${itemId} to Typesense`);
            // Upsert creates or replaces the document 
            await typesenseClient.collections('items').documents().upsert(document);
        } catch (err: any) {
            console.error(`Error upserting item ${itemId} to Typesense:`, err.message);
        }
    }
}
