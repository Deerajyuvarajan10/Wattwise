/**
 * Offline Storage Service
 * Caches data locally and syncs when online
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Storage keys
const KEYS = {
    APPLIANCES: '@wattwise_appliances',
    READINGS: '@wattwise_readings',
    DAILY_USAGE: '@wattwise_daily_usage',
    SETTINGS: '@wattwise_settings',
    PENDING_SYNC: '@wattwise_pending_sync',
    LAST_SYNC: '@wattwise_last_sync',
};

interface PendingOperation {
    id: string;
    type: 'create' | 'update' | 'delete';
    endpoint: string;
    data: any;
    timestamp: number;
}

class OfflineStorageService {
    private isOnline: boolean = true;
    private syncInProgress: boolean = false;

    constructor() {
        // Listen to network changes
        NetInfo.addEventListener(state => {
            const wasOffline = !this.isOnline;
            this.isOnline = state.isConnected ?? true;

            // Sync when coming back online
            if (wasOffline && this.isOnline) {
                this.syncPendingOperations();
            }
        });
    }

    /**
     * Check if device is online
     */
    async checkOnline(): Promise<boolean> {
        const state = await NetInfo.fetch();
        this.isOnline = state.isConnected ?? true;
        return this.isOnline;
    }

    /**
     * Get cached data
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            const data = await AsyncStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error reading from storage:', error);
            return null;
        }
    }

    /**
     * Set cached data
     */
    async set(key: string, data: any): Promise<void> {
        try {
            await AsyncStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Error writing to storage:', error);
        }
    }

    /**
     * Remove cached data
     */
    async remove(key: string): Promise<void> {
        try {
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing from storage:', error);
        }
    }

    // ==================== APPLIANCES ====================

    async cacheAppliances(appliances: any[]): Promise<void> {
        await this.set(KEYS.APPLIANCES, appliances);
    }

    async getCachedAppliances(): Promise<any[]> {
        return (await this.get<any[]>(KEYS.APPLIANCES)) || [];
    }

    // ==================== READINGS ====================

    async cacheReadings(readings: any[]): Promise<void> {
        await this.set(KEYS.READINGS, readings);
    }

    async getCachedReadings(): Promise<any[]> {
        return (await this.get<any[]>(KEYS.READINGS)) || [];
    }

    async addLocalReading(reading: any): Promise<void> {
        const readings = await this.getCachedReadings();
        readings.push({ ...reading, _local: true });
        await this.cacheReadings(readings);

        // Queue for sync
        await this.addPendingOperation({
            id: `reading_${Date.now()}`,
            type: 'create',
            endpoint: '/readings',
            data: reading,
            timestamp: Date.now(),
        });
    }

    // ==================== DAILY USAGE ====================

    async cacheDailyUsage(usage: any[]): Promise<void> {
        await this.set(KEYS.DAILY_USAGE, usage);
    }

    async getCachedDailyUsage(): Promise<any[]> {
        return (await this.get<any[]>(KEYS.DAILY_USAGE)) || [];
    }

    // ==================== SETTINGS ====================

    async cacheSettings(settings: any): Promise<void> {
        await this.set(KEYS.SETTINGS, settings);
    }

    async getCachedSettings(): Promise<any | null> {
        return await this.get(KEYS.SETTINGS);
    }

    // ==================== SYNC OPERATIONS ====================

    /**
     * Add operation to pending sync queue
     */
    async addPendingOperation(operation: PendingOperation): Promise<void> {
        const pending = await this.getPendingOperations();
        pending.push(operation);
        await this.set(KEYS.PENDING_SYNC, pending);
    }

    /**
     * Get all pending operations
     */
    async getPendingOperations(): Promise<PendingOperation[]> {
        return (await this.get<PendingOperation[]>(KEYS.PENDING_SYNC)) || [];
    }

    /**
     * Clear pending operations
     */
    async clearPendingOperations(): Promise<void> {
        await this.set(KEYS.PENDING_SYNC, []);
    }

    /**
     * Sync pending operations with server
     */
    async syncPendingOperations(): Promise<{ success: number; failed: number }> {
        if (this.syncInProgress) {
            return { success: 0, failed: 0 };
        }

        const isOnline = await this.checkOnline();
        if (!isOnline) {
            return { success: 0, failed: 0 };
        }

        this.syncInProgress = true;
        const pending = await this.getPendingOperations();

        let success = 0;
        let failed = 0;
        const stillPending: PendingOperation[] = [];

        for (const operation of pending) {
            try {
                // This would call the actual API
                // For now, we just log it
                console.log('Syncing:', operation);
                success++;
            } catch (error) {
                console.error('Sync failed:', error);
                stillPending.push(operation);
                failed++;
            }
        }

        await this.set(KEYS.PENDING_SYNC, stillPending);
        await this.set(KEYS.LAST_SYNC, Date.now());

        this.syncInProgress = false;
        return { success, failed };
    }

    /**
     * Get last sync timestamp
     */
    async getLastSyncTime(): Promise<number | null> {
        return await this.get<number>(KEYS.LAST_SYNC);
    }

    /**
     * Check if there are pending operations
     */
    async hasPendingSync(): Promise<boolean> {
        const pending = await this.getPendingOperations();
        return pending.length > 0;
    }

    /**
     * Clear all cached data
     */
    async clearAll(): Promise<void> {
        await AsyncStorage.multiRemove([
            KEYS.APPLIANCES,
            KEYS.READINGS,
            KEYS.DAILY_USAGE,
            KEYS.SETTINGS,
            KEYS.PENDING_SYNC,
            KEYS.LAST_SYNC,
        ]);
    }
}

export const offlineStorage = new OfflineStorageService();
