module.exports = {
    // 数据库配置
    database: {
        path: process.env.DB_PATH || './backend/data/database.sqlite'
    },

    // JWT配置
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    },

    // 文件上传配置
    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
        tempDir: process.env.UPLOAD_TEMP_DIR || './frontend/uploads/temp'
    },

    // OCR配置
    ocr: {
        provider: process.env.OCR_PROVIDER || 'aliyun', // 目前只支持阿里云
        aliyun: {
            accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
            accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
            endpoint: process.env.ALIYUN_OCR_ENDPOINT || 'ocr-api.cn-hangzhou.aliyuncs.com'
        }
    },

    // 服务器配置
    server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || 'localhost'
    }
};
