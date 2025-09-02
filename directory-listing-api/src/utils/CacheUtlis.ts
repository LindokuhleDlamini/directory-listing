import { CacheEntry } from '../models/CacheEntry';

export class CacheUtils {
    private cache = new Map<string, CacheEntry>();
    private maxSize: number;

    constructor(maxSize: number = 1000) {
        this.maxSize = maxSize;
    }

    get(key: string): any {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() - entry.timestamp > entry.expiryPeriod) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }

    set(key: string, data: any, expiryPeriod: number = 60000): void {
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) this.cache.delete(oldestKey);
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            expiryPeriod
        });
    }

    clear(): void {
        this.cache.clear();
    }
}
