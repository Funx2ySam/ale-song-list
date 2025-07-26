#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 检查数据库和表是否存在，如果不存在则初始化
console.log('🚀 正在启动歌单系统...\n');

async function checkDatabase() {
    const dbPath = './backend/data/database.sqlite';
    const dbExists = fs.existsSync(dbPath);
    
    let needsInit = !dbExists;
    
    // 如果数据库文件存在，检查表是否存在
    if (dbExists && !needsInit) {
        try {
            const Database = require('better-sqlite3');
            const db = new Database(dbPath);
            
            // 检查关键表是否存在
            const tables = db.prepare(`
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name IN ('streamers', 'songs', 'tags', 'song_tags')
            `).all();
            
            const requiredTables = ['streamers', 'songs', 'tags', 'song_tags'];
            const existingTables = tables.map(t => t.name);
            const missingTables = requiredTables.filter(t => !existingTables.includes(t));
            
            if (missingTables.length > 0) {
                console.log(`⚠️ 缺少数据库表: ${missingTables.join(', ')}`);
                needsInit = true;
            }
            
            db.close();
        } catch (error) {
            console.log('⚠️ 数据库检查失败，需要重新初始化');
            needsInit = true;
        }
    }
    
    if (needsInit) {
        console.log('📦 初始化数据库...');
        const initDb = spawn('node', ['scripts/init-db.js'], { 
            stdio: 'inherit',
            cwd: process.cwd()
        });
        
        initDb.on('close', (code) => {
            if (code === 0) {
                console.log('✅ 数据库初始化完成\n');
                startServer();
            } else {
                console.error('❌ 数据库初始化失败');
                process.exit(1);
            }
        });
    } else {
        console.log('✅ 数据库已存在\n');
        startServer();
    }
}

// 启动数据库检查
checkDatabase().catch(error => {
    console.error('❌ 数据库检查失败:', error);
    process.exit(1);
});

function startServer() {
    console.log('🌟 启动服务器...');
    const server = spawn('node', ['backend/app.js'], { 
        stdio: 'inherit',
        cwd: process.cwd(),
        env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'development' }
    });
    
    // 处理进程终止
    process.on('SIGINT', () => {
        console.log('\n🔄 正在关闭服务器...');
        server.kill('SIGINT');
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log('\n🔄 正在关闭服务器...');
        server.kill('SIGTERM');
        process.exit(0);
    });
    
    server.on('close', (code) => {
        console.log(`\n📝 服务器已关闭 (退出码: ${code})`);
        process.exit(code);
    });
}