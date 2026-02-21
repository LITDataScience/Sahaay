import { Client } from 'typesense';
import * as functions from 'firebase-functions';

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
        change: functions.Change<functions.firestore.DocumentSnapshot>,
        context: functions.EventContext
    ) {
        const itemId = context.params.itemId;

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
            console.log(`Skipping indexing for flagged item: ${itemId}`);
            return;
        }

        const document = {
            id: itemId,
            title: data.title,
            description: data.description,
            price: data.price,
            deposit: data.deposit,
            ownerId: data.ownerId,
            createdAt: data.createdAt?.toMillis() || Date.now()
            // In a full implementation, we would extract lat/lng here into [lat, lng] for radius querying.
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
