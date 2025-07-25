const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// 确保数据目录存在
const dataDir = path.join(__dirname, '../backend/data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('✓ 创建数据目录');
}

// 确保上传目录存在
const uploadDirs = [
    path.join(__dirname, '../frontend/uploads'),
    path.join(__dirname, '../frontend/uploads/avatars'),
    path.join(__dirname, '../frontend/uploads/backgrounds'),
    path.join(__dirname, '../frontend/uploads/temp')
];

uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✓ 创建上传目录: ${path.basename(dir)}`);
    }
});

try {
    // 连接数据库
    const dbPath = path.join(dataDir, 'database.sqlite');
    const db = new Database(dbPath);
    
    console.log('✓ 连接到数据库');

    // 启用外键约束
    db.exec('PRAGMA foreign_keys = ON');

    // 创建用户信息表
    const createStreamerTable = `
        CREATE TABLE IF NOT EXISTS streamer_profile (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL DEFAULT '歌单系统',
            description TEXT DEFAULT '专业歌手 | 各种风格都能唱 | 欢迎点歌互动~',
            avatar_url TEXT DEFAULT '',
            background_url TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;
    
    db.exec(createStreamerTable);
    console.log('✓ 创建用户信息表');

    // 创建标签表
    const createTagsTable = `
        CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;
    
    db.exec(createTagsTable);
    console.log('✓ 创建标签表');

    // 创建歌曲表
    const createSongsTable = `
        CREATE TABLE IF NOT EXISTS songs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            artist TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(title, artist)
        )
    `;
    
    db.exec(createSongsTable);
    console.log('✓ 创建歌曲表');

    // 创建歌曲标签关联表
    const createSongTagsTable = `
        CREATE TABLE IF NOT EXISTS song_tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            song_id INTEGER NOT NULL,
            tag_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (song_id) REFERENCES songs (id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE,
            UNIQUE(song_id, tag_id)
        )
    `;
    
    db.exec(createSongTagsTable);
    console.log('✓ 创建歌曲标签关联表');

    // 检查并插入默认用户信息
    const existingStreamer = db.prepare('SELECT COUNT(*) as count FROM streamer_profile').get();
    if (existingStreamer.count === 0) {
        const insertStreamer = db.prepare(`
            INSERT INTO streamer_profile (name, description) 
            VALUES (?, ?)
        `);
        insertStreamer.run('歌单系统', '专业歌手 | 各种风格都能唱 | 欢迎点歌互动~');
        console.log('✓ 插入默认用户信息');
    }

    // 检查并插入默认标签
    const existingTags = db.prepare('SELECT COUNT(*) as count FROM tags').get();
    if (existingTags.count === 0) {
        const defaultTags = ['流行', '摇滚', '民谣', '古风', '英文', 'R&B', '说唱', '电子', '治愈', '励志'];
        const insertTag = db.prepare('INSERT INTO tags (name) VALUES (?)');
        
        const insertTagsTransaction = db.transaction(() => {
            defaultTags.forEach(tag => {
                insertTag.run(tag);
            });
        });
        
        insertTagsTransaction();
        console.log(`✓ 插入 ${defaultTags.length} 个默认标签`);
    }

    // 检查并插入示例歌曲
    const existingSongs = db.prepare('SELECT COUNT(*) as count FROM songs').get();
    if (existingSongs.count === 0) {
        const sampleSongs = [
            { title: '起风了', artist: '买辣椒也用券', tags: ['流行', '治愈'] },
            { title: '夜曲', artist: '周杰伦', tags: ['流行', 'R&B'] },
            { title: '告白气球', artist: '周杰伦', tags: ['流行'] },
            { title: '夜空中最亮的星', artist: '逃跑计划', tags: ['摇滚', '励志'] },
            { title: '消愁', artist: '毛不易', tags: ['民谣', '治愈'] }
        ];

        const insertSong = db.prepare('INSERT INTO songs (title, artist) VALUES (?, ?)');
        const insertSongTag = db.prepare(`
            INSERT INTO song_tags (song_id, tag_id) 
            SELECT ?, id FROM tags WHERE name = ?
        `);

        const insertSampleData = db.transaction(() => {
            sampleSongs.forEach(song => {
                const result = insertSong.run(song.title, song.artist);
                const songId = result.lastInsertRowid;
                
                song.tags.forEach(tagName => {
                    try {
                        insertSongTag.run(songId, tagName);
                    } catch (err) {
                        console.warn(`标签 "${tagName}" 不存在，跳过`);
                    }
                });
            });
        });

        insertSampleData();
        console.log(`✓ 插入 ${sampleSongs.length} 首示例歌曲`);
    }

    db.close();
    console.log('✓ 数据库初始化完成');

} catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
}