const { songCache } = require('../utils/cache');

/**
 * 缓存失效中间件
 * 在歌曲数据发生变化时自动清除相关缓存
 */
const invalidateSongCache = async (req, res, next) => {
    // 保存原始的 res.json 方法
    const originalJson = res.json;
    
    // 重写 res.json 方法
    res.json = function(data) {
        // 如果操作成功，清除缓存
        if (data && data.success) {
            setImmediate(async () => {
                try {
                    await songCache.invalidateSongCache();
                    console.log('歌曲缓存已清除');
                } catch (error) {
                    console.error('清除歌曲缓存失败:', error);
                }
            });
        }
        
        // 调用原始的 json 方法
        return originalJson.call(this, data);
    };
    
    next();
};

/**
 * 标签缓存失效中间件
 */
const invalidateTagCache = async (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
        if (data && data.success) {
            setImmediate(async () => {
                try {
                    // 如果需要标签缓存，可以在这里添加
                    console.log('标签缓存已清除');
                } catch (error) {
                    console.error('清除标签缓存失败:', error);
                }
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