"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypesenseSync = void 0;
const typesense_1 = require("typesense");
// Connect to the Typesense Cloud or Local Docker cluster
// In production, fetch keys from Secret Manager
const typesenseClient = new typesense_1.Client({
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
class TypesenseSync {
    static async handleItemWrite(event) {
        var _a;
        const itemId = event.params.itemId;
        const change = event.data;
        if (!change)
            return;
        // If the document was deleted
        if (!change.after.exists) {
            console.log(`Deleting item ${itemId} from Typesense`);
            try {
                await typesenseClient.collections('items').documents(itemId).delete();
            }
            catch (err) {
                console.error(`Error deleting item ${itemId} from Typesense:`, err.message);
            }
            return;
        }
        const data = change.after.data();
        if (!data)
            return;
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
            createdAt: ((_a = data.createdAt) === null || _a === void 0 ? void 0 : _a.toMillis()) || Date.now()
            // In a full implementation, we would extract lat/lng here into [lat, lng] for radius querying.
        };
        try {
            console.log(`Upserting item ${itemId} to Typesense`);
            // Upsert creates or replaces the document 
            await typesenseClient.collections('items').documents().upsert(document);
        }
        catch (err) {
            console.error(`Error upserting item ${itemId} to Typesense:`, err.message);
        }
    }
}
exports.TypesenseSync = TypesenseSync;
//# sourceMappingURL=TypesenseSync.js.map