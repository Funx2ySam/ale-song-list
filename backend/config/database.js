const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 获取数据库路径
const dbPath = process.env.DB_PATH || path.join(__dirname, '../data/database.sqlite');

// 确保数据库目录存在
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`📁 创建数据库目录: ${dbDir}`);
}

// 创建数据库连接
const db = new Database(dbPath);

// 启用外键约束
db.pragma('foreign_keys = ON');

console.log('✅ SQLite数据库连接成功');
console.log('✅ 外键约束已启用');

// 初始化数据库表
function initTables() {
    try {
        // 主播表
        db.exec(`
            CREATE TABLE IF NOT EXISTS streamers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                avatar TEXT,
                background TEXT,
                site_title TEXT DEFAULT '歌单系统',
                site_favicon TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 标签表
        db.exec(`
            CREATE TABLE IF NOT EXISTS tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 歌曲表
        db.exec(`
            CREATE TABLE IF NOT EXISTS songs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                artist TEXT NOT NULL,
                difficulty INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 歌曲标签关联表
        db.exec(`
            CREATE TABLE IF NOT EXISTS song_tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                song_id INTEGER,
                tag_id INTEGER,
                FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
                FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
                UNIQUE(song_id, tag_id)
            )
        `);

        // 创建搜索性能优化索引
        db.exec(`CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title)`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist)`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_songs_created_at ON songs(created_at)`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_song_tags_song_id ON song_tags(song_id)`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_song_tags_tag_id ON song_tags(tag_id)`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name)`);

        console.log('✅ 数据库表初始化完成');
        console.log('✅ 数据库索引创建完成');

        // 确保至少有一个默认的streamer记录用于站点设置
        const existingStreamer = db.prepare('SELECT id FROM streamers WHERE id = 1').get();
        if (!existingStreamer) {
            db.prepare(`
                INSERT INTO streamers (name, description, site_title) 
                VALUES (?, ?, ?)
            `).run(
                'Default Streamer', 
                '欢迎来到我的歌单系统', 
                '歌单系统'
            );
            console.log('✅ 创建默认用户记录');
        }

    } catch (error) {
        console.error('❌ 数据库表初始化失败:', error);
        throw error;
    }
}

// 立即执行初始化
initTables();

// 数据库工具函数
const dbUtils = {
    // 执行查询（返回多行）
    all: (sql, params = []) => {
        try {
            const stmt = db.prepare(sql);
            return stmt.all(params);
        } catch (err) {
            console.error('数据库查询错误:', err);
            throw err;
        }
    },

    // 执行查询（返回单行）
    get: (sql, params = []) => {
        try {
            const stmt = db.prepare(sql);
            return stmt.get(params);
        } catch (err) {
            console.error('数据库查询错误:', err);
            throw err;
        }
    },

    // 执行增删改操作
    run: (sql, params = []) => {
        try {
            const stmt = db.prepare(sql);
            return stmt.run(params);
        } catch (err) {
            console.error('数据库操作错误:', err);
            throw err;
        }
    },

    // 开始事务
    transaction: (fn) => {
        const transaction = db.transaction(fn);
        return transaction;
    },

    // 关闭数据库连接
    close: () => {
        try {
            db.close();
            console.log('✅ 数据库连接已关闭');
        } catch (err) {
            console.error('❌ 关闭数据库连接失败:', err);
            throw err;
        }
    }
};

// 优雅关闭数据库连接
process.on('SIGINT', () => {
    console.log('🔄 正在关闭数据库连接...');
    try {
        dbUtils.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ 关闭数据库连接失败:', err);
        process.exit(1);
    }
});

process.on('SIGTERM', () => {
    console.log('🔄 正在关闭数据库连接...');
    try {
        dbUtils.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ 关闭数据库连接失败:', err);
        process.exit(1);
    }
});

// 导出数据库实例和工具函数
module.exports = db;
module.exports.utils = dbUtils;