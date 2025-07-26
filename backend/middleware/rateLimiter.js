const rateLimitStore = new Map();

// 简单的内存限流器
class RateLimiter {
    constructor(windowMs = 60000, maxRequests = 60) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
        this.store = rateLimitStore;
    }
    
    middleware() {
        return (req, res, next) => {
            const clientIP = req.ip || req.connection.remoteAddress;
            const now = Date.now();
            const windowStart = now - this.windowMs;
            
            // 获取客户端请求记录
            if (!this.store.has(clientIP)) {
                this.store.set(clientIP, []);
            }
            
            const requests = this.store.get(clientIP);
            
            // 清理过期记录
            const validRequests = requests.filter(timestamp => timestamp > windowStart);
            
            // 检查是否超过限制
            if (validRequests.length >= this.maxRequests) {
                return res.status(429).json({
                    success: false,
                    error: '请求过于频繁，请稍后再试',
                    retryAfter: Math.ceil(this.windowMs / 1000)
                });
            }
            
            // 记录本次请求
            validRequests.push(now);
            this.store.set(clientIP, validRequests);
            
            // 设置响应头
            res.set({
                'X-RateLimit-Limit': this.maxRequests,
                'X-RateLimit-Remaining': this.maxRequests - validRequests.length,
                'X-RateLimit-Reset': new Date(now + this.windowMs).toISOString()
            });
            
            next();
        };
    }
}

// 创建不同级别的限流器
const createRateLimiter = (options) => new RateLimiter(options.windowMs, options.maxRequests);

// 搜索接口专用限流器（优化后）
const searchLimiter = createRateLimiter({
    windowMs: 60000, // 1分钟
    maxRequests: 60  // 最多60次搜索请求（翻倍）
});

// 通用API限流器
const apiLimiter = createRateLimiter({
    windowMs: 60000, // 1分钟  
    maxRequests: 100 // 最多100次请求
});

// 定期清理过期数据
setInterval(() => {
    const now = Date.now();
    for (const [clientIP, requests] of rateLimitStore.entries()) {
        const validRequests = requests.filter(timestamp => timestamp > now - 300000); // 保留5分钟内的数据
        if (validRequests.length === 0) {
            rateLimitStore.delete(clientIP);
        } else {
            rateLimitStore.set(clientIP, validRequests);
        }
    }
}, 300000); // 每5分钟清理一次

module.exports = {
    searchLimiter: searchLimiter.middleware(),
    apiLimiter: apiLimiter.middleware()
}; 