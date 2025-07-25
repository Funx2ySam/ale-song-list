const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

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