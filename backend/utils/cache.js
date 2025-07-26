// 多层缓存管理工具
class CacheManager {
    constructor() {
        this.memoryCache = new Map();
        this.defaultTTL = 5 * 60 * 1000; // 5分钟
        this.maxMemoryItems = 1000;
        
        // 如果有Redis配置，可以启用Redis缓存
        this.redisEnabled = process.env.REDIS_URL && false; // 暂时禁用，需要安装Redis
    }
    
    // 生成缓存键
    generateKey(prefix, params) {
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}:${params[key]}`)
            .join('|');
        return `${prefix}:${sortedParams}`;
    }
    
    // 获取缓存
    async get(key) {
        // 先检查内存缓存
        if (this.memoryCache.has(key)) {
            const item = this.memoryCache.get(key);
            if (Date.now() < item.expiry) {
                return item.data;
            } else {
                this.memoryCache.delete(key);
            }
        }
        
        // TODO: 检查Redis缓存
        // if (this.redisEnabled) {
        //     const redisData = await redis.get(key);
        //     if (redisData) return JSON.parse(redisData);
        // }
        
        return null;
    }
    
    // 设置缓存
    async set(key, data, ttl = this.defaultTTL) {
        // 内存缓存
        this.memoryCache.set(key, {
            data: data,
            expiry: Date.now() + ttl
        });
        
        // 限制内存缓存大小
        if (this.memoryCache.size > this.maxMemoryItems) {
            const oldestKey = this.memoryCache.keys().next().value;
            this.memoryCache.delete(oldestKey);
        }
        
        // TODO: Redis缓存
        // if (this.redisEnabled) {
        //     await redis.setex(key, ttl / 1000, JSON.stringify(data));
        // }
    }
    
    // 删除缓存
    async delete(key) {
        this.memoryCache.delete(key);
        
        // TODO: Redis删除
        // if (this.redisEnabled) {
        //     await redis.del(key);
        // }
    }
    
    // 清空所有缓存
    async clear() {
        this.memoryCache.clear();
        
        // TODO: Redis清空
        // if (this.redisEnabled) {
        //     await redis.flushall();
        // }
    }
    
    // 获取缓存统计
    getStats() {
        return {
            memoryItems: this.memoryCache.size,
            memorySize: JSON.stringify([...this.memoryCache.entries()]).length,
            redisEnabled: this.redisEnabled
        };
    }
}

// 歌曲查询专用缓存类
class SongQueryCache extends CacheManager {
    constructor() {
        super();
        this.prefix = 'songs_query';
    }
    
    // 获取歌曲查询缓存
    async getSongs(page, limit, search = '', tag = '') {
        const key = this.generateKey(this.prefix, { page, limit, search, tag });
        return await this.get(key);
    }
    
    // 缓存歌曲查询结果
    async setSongs(page, limit, search = '', tag = '', data) {
        const key = this.generateKey(this.prefix, { page, limit, search, tag });
        await this.set(key, data);
    }
    
    // 当歌曲数据更新时，清除相关缓存
    async invalidateSongCache() {
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