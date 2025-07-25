#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 正在启动主播歌单系统...\n');

// 检查数据库是否存在
const dbPath = './backend/data/database.sqlite';
const dbExists = fs.existsSync(dbPath);

if (!dbExists) {
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