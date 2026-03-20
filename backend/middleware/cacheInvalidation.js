const { songCache } = require('../utils/cache');

/**
 * 缓存失效中间件
 * 在歌曲数据发生变化时自动清除相关缓存
 */
const invalidateSongCache = (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
        if (data && data.success) {
            setImmediate(() => {
                try {
                    songCache.invalidateSongCache();
                } catch (error) {
                    console.error('清除歌曲缓存失败:', error);
                }
            });
        }
        return originalJson.call(this, data);
    };
    
    next();
};

const invalidateTagCache = (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
        if (data && data.success) {
            setImmediate(() => {
                songCache.invalidateSongCache();
            });
        }
        return originalJson.call(this, data);
    };
    
    next();
};

/**
 * 条件性缓存失效
 * 只在特定操作时清除缓存
 */
const conditionalCacheInvalidation = (operations = []) => {
    return async (req, res, next) => {
        const method = req.method.toLowerCase();
        const shouldInvalidate = operations.includes(method) || 
                               (method === 'post' && operations.includes('create')) ||
                               (method === 'put' && operations.includes('update')) ||
                               (method === 'delete' && operations.includes('delete'));
        
        if (shouldInvalidate) {
            return invalidateSongCache(req, res, next);
        }
        
        next();
    };
};

module.exports = {
    invalidateSongCache,
    invalidateTagCache,
    conditionalCacheInvalidation
}; 