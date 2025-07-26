#!/usr/bin/env node

/**
 * 修复验证脚本
 * 检查数据库表是否正确创建，站点设置是否可用
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

console.log('🔍 开始验证修复状态...\n');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../backend/data/database.sqlite');

console.log('📍 数据库路径:', dbPath);

try {
    // 检查数据库文件是否存在
    if (!fs.existsSync(dbPath)) {
        console.log('❌ 数据库文件不存在');
        process.exit(1);
    }
    
    // 创建数据库连接
    const db = new Database(dbPath);
    
    console.log('✅ 数据库连接成功\n');
    
    // 检查必需的表
    console.log('📊 检查数据库表...');
    const requiredTables = ['streamers', 'songs', 'tags', 'song_tags'];
    const tables = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all();
    
    const existingTables = tables.map(t => t.name);
    console.log('现有表:', existingTables.join(', '));
    
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));
    if (missingTables.length > 0) {
        console.log('❌ 缺少必需的表:', missingTables.join(', '));
        db.close();
        process.exit(1);
    }
    
    console.log('✅ 所有必需的表都存在\n');
    
    // 检查streamers表结构
    console.log('🏗️ 检查streamers表结构...');
    const streamerColumns = db.prepare(`PRAGMA table_info(streamers)`).all();
    const columnNames = streamerColumns.map(col => col.name);
    
    const requiredColumns = ['id', 'name', 'site_title', 'site_favicon'];
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
    
    if (missingColumns.length > 0) {
        console.log('❌ streamers表缺少列:', missingColumns.join(', '));
        db.close();
        process.exit(1);
    }
    
    console.log('✅ streamers表结构正确');
    console.log('表列:', columnNames.join(', '));
    
    // 检查默认用户记录
    console.log('\n👤 检查默认用户记录...');
    const defaultUser = db.prepare('SELECT * FROM streamers WHERE id = 1').get();
    
    if (!defaultUser) {
        console.log('❌ 没有找到默认用户记录');
        db.close();
        process.exit(1);
    }
    
    console.log('✅ 默认用户记录存在');
    console.log('用户信息:', {
        id: defaultUser.id,
        name: defaultUser.name,
        site_title: defaultUser.site_title,
        has_favicon: !!defaultUser.site_favicon
    });
    
    // 检查索引
    console.log('\n📑 检查数据库索引...');
    const indexes = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='index' AND name LIKE 'idx_%'
    `).all();
    
    const indexNames = indexes.map(idx => idx.name);
    console.log('现有索引:', indexNames.join(', '));
    
    if (indexNames.length === 0) {
        console.log('⚠️ 没有找到性能优化索引');
    } else {
        console.log('✅ 性能优化索引已创建');
    }
    
    // 统计数据
    console.log('\n📈 数据统计:');
    requiredTables.forEach(tableName => {
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
        console.log(`   ${tableName}: ${count.count} 条记录`);
    });
    
    // 关闭数据库连接
    db.close();
    
    console.log('\n🎉 修复验证完成！所有检查都通过了。');
    console.log('💡 提示：如果仍有问题，请检查:');
    console.log('   1. Docker volume 映射是否正确');
    console.log('   2. 文件权限是否正确');
    console.log('   3. 环境变量是否设置正确');
    
} catch (error) {
    console.error('❌ 验证过程中出现错误:', error);
    process.exit(1);
} 