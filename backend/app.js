const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const logger = require('./utils/logger');
require('dotenv').config();

const config = require('./config/config');
const app = express();
const PORT = config.server.port;

// 确保上传目录存在
const uploadDir = './frontend/uploads'; // 固定路径，避免配置复杂化
const uploadSubDirs = ['avatars', 'backgrounds', 'temp'];

uploadSubDirs.forEach(subDir => {
    const dirPath = path.join(uploadDir, subDir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        logger.info(`创建上传目录: ${dirPath}`);
    }
});

// 请求日志中间件
app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent')
        };
        
        if (res.statusCode >= 400) {
            logger.warn(`HTTP ${res.statusCode}`, logData);
        } else {
            logger.info(`HTTP ${res.statusCode}`, logData);
        }
    });
    
    next();
});

// 中间件配置
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? false : true,
    credentials: true
}));

app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf, encoding) => {
        // 验证JSON格式
        try {
            if (buf && buf.length) {
                JSON.parse(buf);
            }
        } catch (err) {
            logger.error('无效的JSON格式', { 
                url: req.originalUrl, 
                error: err.message 
            });
            const error = new Error('Invalid JSON format');
            error.status = 400;
            throw error;
        }
    }
}));

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, '../frontend/uploads')));

// 应用通用限流器到API路由
const { apiLimiter } = require('./middleware/rateLimiter');
app.use('/api', apiLimiter);

// API路由
app.use('/api', require('./routes/api'));

// 前端路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

// 404处理
app.use('*', (req, res) => {
    logger.warn('404 Not Found', { 
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
    });
    
    if (req.originalUrl.startsWith('/api')) {
        res.status(404).json({ 
            success: false,
            error: 'API endpoint not found' 
        });
    } else {
        res.redirect('/');
    }
});

// 错误处理中间件
app.use((err, req, res, next) => {
    const errorData = {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        body: req.body,
        query: req.query,
        params: req.params
    };
    
    logger.error('服务器错误', errorData);
    
    const status = err.status || 500;
    const message = status === 500 && process.env.NODE_ENV === 'production' 
        ? '服务器内部错误' 
        : err.message;
    
    res.status(status).json({ 
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 启动服务器，带端口冲突检测
const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info('服务器启动成功', {
        port: PORT,
        environment: process.env.NODE_ENV,
        baseUrl: `http://localhost:${PORT}`,
        adminUrl: `http://localhost:${PORT}/admin`
    });
    
    console.log(`🚀 服务器启动成功!`);
    console.log(`📍 访问地址: http://localhost:${PORT}`);
    console.log(`🎛️ 管理后台: http://localhost:${PORT}/admin`);
    console.log(`🔧 环境模式: ${process.env.NODE_ENV || 'development'}`);
    console.log('=====================================');
});

// 处理端口冲突错误
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ 端口 ${PORT} 已被占用，请尝试以下解决方案:`);
        console.error(`   1. 使用不同端口: PORT=3002 node backend/app.js`);
        console.error(`   2. 结束占用端口的进程`);
        console.error(`   3. 在Windows中，可能是System进程占用，尝试使用其他端口`);
        process.exit(1);
    } else if (err.code === 'EACCES') {
        console.error(`❌ 权限被拒绝，请尝试以下解决方案:`);
        console.error(`   1. 使用更高的端口号: PORT=8080 node backend/app.js`);
        console.error(`   2. 以管理员身份运行`);
        console.error(`   3. 使用端口号 > 1024`);
        process.exit(1);
    } else {
        console.error('❌ 服务器启动失败:', err);
        process.exit(1);
    }
});

// 优雅关闭处理
const gracefulShutdown = (signal) => {
    logger.info(`收到 ${signal} 信号，正在关闭服务器...`);
    console.log(`🔄 收到 ${signal} 信号，服务器正在关闭...`);
    
    // 这里可以添加清理逻辑，如关闭数据库连接等
    setTimeout(() => {
        logger.info('服务器已关闭');
        process.exit(0);
    }, 1000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 未捕获异常处理
process.on('uncaughtException', (err) => {
    logger.error('未捕获的异常', {
        message: err.message,
        stack: err.stack
    });
    console.error('未捕获的异常:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('未处理的Promise拒绝', {
        reason: reason,
        promise: promise
    });
    console.error('未处理的Promise拒绝:', reason);
});