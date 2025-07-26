const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { validateSong, validateId, validatePagination, validateSearch } = require('../middleware/validation');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const XLSX = require('xlsx');

// 获取歌曲列表（公开接口）
router.get('/', validatePagination, validateSearch, (req, res) => {
    try {
        const { search = '', tag = '' } = req.query;
        const { page, limit } = req.pagination;
        
        const pageNum = page;
        const limitNum = limit;
        const offset = (pageNum - 1) * limitNum;

        let baseQuery = `
            SELECT DISTINCT s.id, s.title, s.artist, s.created_at
            FROM songs s
        `;
        
        let countQuery = `
            SELECT COUNT(DISTINCT s.id) as total
            FROM songs s
        `;

        let whereConditions = [];
        let queryParams = [];

        // 添加搜索条件
        if (search.trim()) {
            whereConditions.push('(s.title LIKE ? OR s.artist LIKE ?)');
            const searchTerm = `%${search.trim()}%`;
            queryParams.push(searchTerm, searchTerm);
        }

        // 添加标签过滤条件
        if (tag.trim()) {
            baseQuery += ` LEFT JOIN song_tags st ON s.id = st.song_id
                          LEFT JOIN tags t ON st.tag_id = t.id`;
            countQuery += ` LEFT JOIN song_tags st ON s.id = st.song_id
                           LEFT JOIN tags t ON st.tag_id = t.id`;
            whereConditions.push('t.name = ?');
            queryParams.push(tag.trim());
        }

        // 构建WHERE子句
        if (whereConditions.length > 0) {
            const whereClause = ` WHERE ${whereConditions.join(' AND ')}`;
            baseQuery += whereClause;
            countQuery += whereClause;
        }

        // 添加排序和分页
        baseQuery += ` ORDER BY s.created_at DESC LIMIT ? OFFSET ?`;

        // 获取总数
        const totalResult = db.prepare(countQuery).get(...queryParams);
        const total = totalResult.total;

        // 获取歌曲列表
        const songs = db.prepare(baseQuery).all(...queryParams, limitNum, offset);

        // 为每首歌曲获取标签
        const songsWithTags = songs.map(song => {
            const tags = db.prepare(`
                SELECT t.name 
                FROM tags t 
                JOIN song_tags st ON t.id = st.tag_id 
                WHERE st.song_id = ?
                ORDER BY t.name
            `).all(song.id);

            return {
                ...song,
                tags: tags.map(tag => tag.name)
            };
        });

        res.json({
            success: true,
            data: {
                songs: songsWithTags,
                pagination: {
                    total: total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum)
                }
            }
        });

    } catch (error) {
        console.error('获取歌曲列表失败:', error);
        res.status(500).json({
            success: false,
            error: '获取歌曲列表失败'
        });
    }
});

// 下载Excel导入模板（公开接口）- 必须在/:id路由之前
router.get('/template', (req, res) => {
    try {
        console.log('模板下载请求收到');
        
        // 创建模板数据
        const templateData = [
            {
                '歌曲名称': '起风了',
                '歌手': '买辣椒也用券',
                '标签': '国语,流行,治愈'
            },
            {
                '歌曲名称': '夜曲',
                '歌手': '周杰伦',
                '标签': '国语,R&B,经典'
            },
            {
                '歌曲名称': '示例歌曲3',
                '歌手': '示例歌手3',
                '标签': '标签1,标签2'
            },
            {
                '歌曲名称': '',
                '歌手': '',
                '标签': ''
            },
            {
                '歌曲名称': '说明：',
                '歌手': '',
                '标签': ''
            },
            {
                '歌曲名称': '1. 歌曲名称为必填项',
                '歌手': '',
                '标签': ''
            },
            {
                '歌曲名称': '2. 歌手可以为空',
                '歌手': '',
                '标签': ''
            },
            {
                '歌曲名称': '3. 标签用逗号分隔，不存在会自动创建',
                '歌手': '',
                '标签': ''
            },
            {
                '歌曲名称': '4. 相同歌名+歌手的歌曲会自动跳过',
                '歌手': '',
                '标签': ''
            }
        ];

        console.log('开始创建Excel工作簿');
        
        // 创建工作簿
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(templateData);

        // 设置列宽
        worksheet['!cols'] = [
            { wch: 30 }, // 歌曲名称
            { wch: 20 }, // 歌手
            { wch: 25 }  // 标签
        ];

        // 添加工作表
        XLSX.utils.book_append_sheet(workbook, worksheet, '歌曲列表');

        console.log('开始生成Buffer');
        
        // 生成Buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        console.log('Buffer生成成功，发送文件');
        
        // 设置响应头
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="songlist-template.xlsx"');

        res.send(buffer);

    } catch (error) {
        console.error('生成模板失败:', error);
        res.status(500).json({
            success: false,
            error: '生成模板失败: ' + error.message
        });
    }
});

// 获取单首歌曲详情（公开接口）
router.get('/:id', validateId, (req, res) => {
    try {
        const { id } = req.params;

        const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(id);

        if (!song) {
            return res.status(404).json({
                success: false,
                error: '歌曲不存在'
            });
        }

        // 获取歌曲标签
        const tags = db.prepare(`
            SELECT t.name 
            FROM tags t 
            JOIN song_tags st ON t.id = st.tag_id 
            WHERE st.song_id = ?
            ORDER BY t.name
        `).all(id);

        res.json({
            success: true,
            data: {
                ...song,
                tags: tags.map(tag => tag.name)
            }
        });

    } catch (error) {
        console.error('获取歌曲详情失败:', error);
        res.status(500).json({
            success: false,
            error: '获取歌曲详情失败'
        });
    }
});



// 以下接口需要身份验证
router.use(authenticateToken);
router.use(requireAdmin);

// 添加新歌曲
router.post('/', validateSong, (req, res) => {
    try {
        const { title, artist, tags = [] } = req.body;

        const songTitle = title.trim();
        const songArtist = artist.trim();

        // 检查歌曲是否已存在
        const existingSong = db.prepare('SELECT id FROM songs WHERE title = ? AND artist = ?').get(songTitle, songArtist);
        if (existingSong) {
            return res.status(409).json({
                success: false,
                error: '该歌曲已存在'
            });
        }

        // 使用事务添加歌曲和标签关联
        const addSongTransaction = db.transaction((songData) => {
            // 插入歌曲
            const insertSong = db.prepare('INSERT INTO songs (title, artist) VALUES (?, ?)');
            const songResult = insertSong.run(songData.title, songData.artist);
            const songId = songResult.lastInsertRowid;

            // 添加标签关联
            if (songData.tags && songData.tags.length > 0) {
                const insertSongTag = db.prepare(`
                    INSERT INTO song_tags (song_id, tag_id) 
                    SELECT ?, id FROM tags WHERE name = ?
                `);

                songData.tags.forEach(tagName => {
                    if (tagName.trim()) {
                        try {
                            insertSongTag.run(songId, tagName.trim());
                        } catch (err) {
                            // 如果标签不存在，跳过
                            console.warn(`标签 "${tagName}" 不存在，已跳过`);
                        }
                    }
                });
            }

            return songId;
        });

        const songId = addSongTransaction({
            title: songTitle,
            artist: songArtist,
            tags: tags
        });

        res.json({
            success: true,
            message: '歌曲添加成功',
            data: {
                id: songId,
                title: songTitle,
                artist: songArtist,
                tags: tags
            }
        });

    } catch (error) {
        console.error('添加歌曲失败:', error);
        res.status(500).json({
            success: false,
            error: '添加歌曲失败'
        });
    }
});

// 更新歌曲
router.put('/:id', validateId, validateSong, (req, res) => {
    try {
        const { id } = req.params;
        const { title, artist, tags = [] } = req.body;

        const songTitle = title.trim();
        const songArtist = artist.trim();

        // 检查歌曲是否存在
        const existingSong = db.prepare('SELECT id FROM songs WHERE id = ?').get(id);
        if (!existingSong) {
            return res.status(404).json({
                success: false,
                error: '歌曲不存在'
            });
        }

        // 使用事务更新歌曲和标签关联
        const updateSongTransaction = db.transaction((songData) => {
            // 更新歌曲基本信息
            const updateSong = db.prepare(`
                UPDATE songs 
                SET title = ?, artist = ? 
                WHERE id = ?
            `);
            updateSong.run(songData.title, songData.artist, songData.id);

            // 删除现有标签关联
            const deleteSongTags = db.prepare('DELETE FROM song_tags WHERE song_id = ?');
            deleteSongTags.run(songData.id);

            // 添加新的标签关联
            if (songData.tags && songData.tags.length > 0) {
                const insertSongTag = db.prepare(`
                    INSERT INTO song_tags (song_id, tag_id) 
                    SELECT ?, id FROM tags WHERE name = ?
                `);

                songData.tags.forEach(tagName => {
                    if (tagName.trim()) {
                        try {
                            insertSongTag.run(songData.id, tagName.trim());
                        } catch (err) {
                            console.warn(`标签 "${tagName}" 不存在，已跳过`);
                        }
                    }
                });
            }
        });

        updateSongTransaction({
            id: id,
            title: songTitle,
            artist: songArtist,
            tags: tags
        });

        res.json({
            success: true,
            message: '歌曲更新成功'
        });

    } catch (error) {
        console.error('更新歌曲失败:', error);
        res.status(500).json({
            success: false,
            error: '更新歌曲失败'
        });
    }
});

// 删除歌曲
router.delete('/:id', validateId, (req, res) => {
    try {
        const { id } = req.params;

        // 检查歌曲是否存在
        const existingSong = db.prepare('SELECT id FROM songs WHERE id = ?').get(id);
        if (!existingSong) {
            return res.status(404).json({
                success: false,
                error: '歌曲不存在'
            });
        }

        // 使用事务删除歌曲和相关标签关联
        const deleteSongTransaction = db.transaction(() => {
            // 删除标签关联（由于外键约束，会自动删除）
            const deleteSongTags = db.prepare('DELETE FROM song_tags WHERE song_id = ?');
            deleteSongTags.run(id);

            // 删除歌曲
            const deleteSong = db.prepare('DELETE FROM songs WHERE id = ?');
            return deleteSong.run(id);
        });

        const result = deleteSongTransaction();

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                error: '歌曲删除失败'
            });
        }

        res.json({
            success: true,
            message: '歌曲删除成功'
        });

    } catch (error) {
        console.error('删除歌曲失败:', error);
        res.status(500).json({
            success: false,
            error: '删除歌曲失败'
        });
    }
});

module.exports = router;