const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const SEARCH_MAX_REQUESTS = 60;
const API_MAX_REQUESTS = 100;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

const rateLimitStore = new Map();

class RateLimiter {
    constructor(windowMs = RATE_LIMIT_WINDOW_MS, maxRequests = SEARCH_MAX_REQUESTS) {
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

const searchLimiter = createRateLimiter({
    windowMs: RATE_LIMIT_WINDOW_MS,
    maxRequests: SEARCH_MAX_REQUESTS
});

const apiLimiter = createRateLimiter({
    windowMs: RATE_LIMIT_WINDOW_MS,
    maxRequests: API_MAX_REQUESTS
});

setInterval(() => {
    const now = Date.now();
    for (const [clientIP, requests] of rateLimitStore.entries()) {
        const validRequests = requests.filter(timestamp => timestamp > now - CLEANUP_INTERVAL_MS);
        if (validRequests.length === 0) {
            rateLimitStore.delete(clientIP);
        } else {
            rateLimitStore.set(clientIP, validRequests);
        }
    }
}, CLEANUP_INTERVAL_MS);

module.exports = {
    searchLimiter: searchLimiter.middleware(),
    apiLimiter: apiLimiter.middleware()
}; 