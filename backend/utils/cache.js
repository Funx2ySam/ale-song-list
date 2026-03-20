const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_MEMORY_ITEMS = 1000;

class CacheManager {
    constructor() {
        this.memoryCache = new Map();
        this.defaultTTL = CACHE_TTL_MS;
        this.maxMemoryItems = MAX_MEMORY_ITEMS;
    }
    
    generateKey(prefix, params) {
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}:${params[key]}`)
            .join('|');
        return `${prefix}:${sortedParams}`;
    }
    
    get(key) {
        if (this.memoryCache.has(key)) {
            const item = this.memoryCache.get(key);
            if (Date.now() < item.expiry) {
                return item.data;
            }
            this.memoryCache.delete(key);
        }
        return null;
    }
    
    set(key, data, ttl = this.defaultTTL) {
        this.memoryCache.set(key, {
            data: data,
            expiry: Date.now() + ttl
        });
        
        if (this.memoryCache.size > this.maxMemoryItems) {
            const oldestKey = this.memoryCache.keys().next().value;
            if (oldestKey !== undefined) this.memoryCache.delete(oldestKey);
        }
    }
    
    delete(key) {
        this.memoryCache.delete(key);
    }
    
    clear() {
        this.memoryCache.clear();
    }
    
    getStats() {
        return {
            memoryItems: this.memoryCache.size
        };
    }
}

// 歌曲查询专用缓存类
class SongQueryCache extends CacheManager {
    constructor() {
        super();
        this.prefix = 'songs_query';
    }
    
    getSongs(page, limit, search = '', tag = '') {
        const key = this.generateKey(this.prefix, { page, limit, search, tag });
        return this.get(key);
    }
    
    setSongs(page, limit, search = '', tag = '', data) {
        const key = this.generateKey(this.prefix, { page, limit, search, tag });
        this.set(key, data);
    }
    
    invalidateSongCache() {
        // 清除所有歌曲查询缓存
        for (const [key] of this.memoryCache.entries()) {
            if (key.startsWith(this.prefix)) {
                this.memoryCache.delete(key);
            }
        }
    }
}

// 创建全局实例
const songCache = new SongQueryCache();

module.exports = {
    CacheManager,
    SongQueryCache,
    songCache
}; 