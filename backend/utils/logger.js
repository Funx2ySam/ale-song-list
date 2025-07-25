const fs = require('fs');
const path = require('path');

// 确保日志目录存在
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// 获取当前日期字符串
const getLogDate = () => {
    return new Date().toISOString().split('T')[0];
};

// 格式化日志消息
const formatLogMessage = (level, message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        ...meta
    };
    return JSON.stringify(logEntry) + '\n';
};

// 写入日志文件
const writeLog = (level, message, meta = {}) => {
    const logFileName = `${getLogDate()}.log`;
    const logFilePath = path.join(logDir, logFileName);
    const formattedMessage = formatLogMessage(level, message, meta);
    
    // 异步写入日志，避免阻塞
    fs.appendFile(logFilePath, formattedMessage, (err) => {
        if (err) {
            console.error('写入日志失败:', err);
        }
    });
    
    // 同时输出到控制台
    const consoleMessage = `[${new Date().toISOString()}] ${level.toUpperCase()}: ${message}`;
    if (Object.keys(meta).length > 0) {
        console.log(consoleMessage, meta);
    } else {
        console.log(consoleMessage);
    }
};

// 日志级别
const logger = {
    info: (message, meta = {}) => writeLog('info', message, meta),
    warn: (message, meta = {}) => writeLog('warn', message, meta),
    error: (message, meta = {}) => writeLog('error', message, meta),
    debug: (message, meta = {}) => {
        if (process.env.NODE_ENV === 'development') {
            writeLog('debug', message, meta);
        }
    }
};

// 清理旧日志文件（保留最近7天）
const cleanOldLogs = () => {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
    const now = Date.now();
    
    fs.readdir(logDir, (err, files) => {
        if (err) return;
        
        files.forEach(file => {
            const filePath = path.join(logDir, file);
            fs.stat(filePath, (err, stats) => {
                if (err) return;
                
                if (now - stats.mtime.getTime() > maxAge) {
                    fs.unlink(filePath, (err) => {
                        if (!err) {
                            logger.info(`清理旧日志文件: ${file}`);
                        }
                    });
                }
            });
        });
    });
};

// 每天清理一次旧日志
setInterval(cleanOldLogs, 24 * 60 * 60 * 1000);

module.exports = logger;