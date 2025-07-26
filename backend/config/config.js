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

    // 站点设置（环境变量默认值）
    site: {
        defaultTitle: process.env.SITE_TITLE || '歌单系统',
        defaultFavicon: process.env.SITE_FAVICON || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iIzY2N2VlYSIvPgo8cGF0aCBkPSJNOCAxMGg2djJIOHYtMnptMCA0aDZ2Mkg4di0yem0wIDRoNHYySDB2LTJ6bTEwLThIMjZ2MkgxOFY2em0wIDRoOHYySDE4di0yem0wIDRoNnYySDE4di0yeiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
        adminSuffix: process.env.ADMIN_TITLE_SUFFIX || ' - 管理后台'
    },

    // 服务器配置
    server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || 'localhost'
    }
};
