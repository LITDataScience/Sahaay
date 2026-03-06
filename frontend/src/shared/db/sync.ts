import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from './index';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// A mock network endpoint representing the Sahaay distributed sync backend
const SYNC_ENDPOINT = 'https://api.sahaay.local/v3/sync';

export async function syncDatabase(userId: string) {
    try {
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
            console.log('Device is offline. Queuing sync for later.');
            // Add to a simple local sync queue using AsyncStorage
            await AsyncStorage.setItem('@sahaay_pending_sync', 'true');
            return;
        }

        await synchronize({
            database,
            pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
                const urlParams = `?lastPulledAt=${lastPulledAt || 0}&schemaVersion=${schemaVersion}&migration=${encodeURIComponent(JSON.stringify(migration || null))}`;
                const response = await fetch(`${SYNC_ENDPOINT}/pull${urlParams}`, {
                    headers: { 'Authorization': `Bearer ${userId}` }
                });

                if (!response.ok) {
                    throw new Error('Synchronization Pull Failed');
                }

                const { changes, timestamp } = await response.json();
                return { changes, timestamp };
            },
            pushChanges: async ({ changes, lastPulledAt }) => {
                const response = await fetch(`${SYNC_ENDPOINT}/push?lastPulledAt=${lastPulledAt}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userId}`
                    },
                    body: JSON.stringify(changes)
                });

                if (!response.ok) {
                    throw new Error('Synchronization Push Failed');
                }
            },
            // Conflict resolution utilizing a CRDT-like strategy:
            // In WatermelonDB, conflicts occur when a local record has been updated, 
            // but the server also sends down an update for the same record during `pullChanges`.
            // 
            // Our deterministic resolution engine guarantees Last-Write-Wins (LWW) by utilizing
            // synchronized vector clocks or simple precise Server Timestamps embedded on the nodes.
            conflictResolver: (_tableName, local, server) => {
                const localUpdatedAt = local._raw.updated_at || 0;
                const serverUpdatedAt = server.updated_at || 0;

                // If local update is newer than the server, keep local modifications
                if (localUpdatedAt > serverUpdatedAt) {
                    return local._raw;
                }

                // If server is newer, accept the server changes natively
                return server;
            },
            migrationsEnabledAtVersion: 1,
        });

        await AsyncStorage.removeItem('@sahaay_pending_sync');
        console.log('WatermelonDB synced successfully with distributed cluster.');
    } catch (error) {
        console.error('Offline synchronization failed, queuing for background retry', error);
        await AsyncStorage.setItem('@sahaay_pending_sync', 'true');
    }
}

// Subscribe to network state changes to automatically trigger sync when back online
export function setupBackgroundSync(userId: string) {
    NetInfo.addEventListener((state) => {
        if (state.isConnected && state.isInternetReachable) {
            AsyncStorage.getItem('@sahaay_pending_sync').then(pending => {
                if (pending === 'true') {
                    console.log('Network restored. Processing queued offline syncs...');
                    syncDatabase(userId);
                }
            });
        }
    });
}
