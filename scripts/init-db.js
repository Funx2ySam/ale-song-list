#!/usr/bin/env node

/**
 * 数据库初始化脚本
 * 用于Docker部署时确保数据库表正确创建
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 获取数据库路径
const dbPath = process.env.DB_PATH || path.join(__dirname, '../backend/data/database.sqlite');

console.log('🔧 开始数据库初始化...');
console.log('📍 数据库路径:', dbPath);

// 确保数据库目录存在
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`📁 创建数据库目录: ${dbDir}`);
}

try {
    // 创建数据库连接
    const db = new Database(dbPath);
    
    // 启用外键约束
    db.pragma('foreign_keys = ON');
    
    console.log('✅ 数据库连接成功');
    
    // 创建表
    console.log('🔨 创建数据库表...');
    
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
    
    console.log('✅ 数据库表创建完成');
    
    // 创建索引
    console.log('📊 创建数据库索引...');
    db.exec(`CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_songs_created_at ON songs(created_at)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_song_tags_song_id ON song_tags(song_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_song_tags_tag_id ON song_tags(tag_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name)`);
    
    console.log('✅ 数据库索引创建完成');
    
    // 检查并创建默认用户
    console.log('👤 检查默认用户...');
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
    } else {
        console.log('✅ 默认用户已存在');
    }
    
    // 检查表是否存在
    const tables = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all();
    
    console.log('📋 数据库表列表:');
    tables.forEach(table => {
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
        console.log(`   - ${table.name}: ${count.count} 条记录`);
    });
    
    // 关闭数据库连接
    db.close();
    
    console.log('🎉 数据库初始化完成！');
    
} catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
}