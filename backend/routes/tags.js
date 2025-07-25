const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { validateTag, validateId } = require('../middleware/validation');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// 获取所有标签（公开接口）
router.get('/', (req, res) => {
    try {
        const tags = db.prepare('SELECT * FROM tags ORDER BY name').all();
        
        res.json({
            success: true,
            data: tags.map(tag => tag.name)
        });

    } catch (error) {
        console.error('获取标签列表失败:', error);
        res.status(500).json({
            success: false,
            error: '获取标签列表失败'
        });
    }
});

// 获取标签详细信息（公开接口）
router.get('/details', (req, res) => {
    try {
        const tagsWithStats = db.prepare(`
            SELECT 
                t.id,
                t.name,
                t.created_at,
                COUNT(st.tag_id) as usage_count
            FROM tags t
            LEFT JOIN song_tags st ON t.id = st.tag_id
            GROUP BY t.id, t.name, t.created_at
            ORDER BY usage_count DESC, t.name
        `).all();

        res.json({
            success: true,
            data: tagsWithStats
        });

    } catch (error) {
        console.error('获取标签详细信息失败:', error);
        res.status(500).json({
            success: false,
            error: '获取标签详细信息失败'
        });
    }
});

// 以下接口需要身份验证
router.use(authenticateToken);
router.use(requireAdmin);

// 添加新标签
router.post('/', validateTag, (req, res) => {
    try {
        const { name } = req.body;

        const tagName = name.trim();

        // 检查标签是否已存在
        const existingTag = db.prepare('SELECT id FROM tags WHERE name = ?').get(tagName);
        if (existingTag) {
            return res.status(409).json({
                success: false,
                error: '标签已存在'
            });
        }

        // 插入新标签
        const insertTag = db.prepare('INSERT INTO tags (name) VALUES (?)');
        const result = insertTag.run(tagName);

        res.json({
            success: true,
            message: '标签添加成功',
            data: {
                id: result.lastInsertRowid,
                name: tagName
            }
        });

    } catch (error) {
        console.error('添加标签失败:', error);
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            res.status(409).json({
                success: false,
                error: '标签已存在'
            });
        } else {
            res.status(500).json({
                success: false,
                error: '添加标签失败'
            });
        }
    }
});

// 删除标签
router.delete('/:name', (req, res) => {
    try {
        const { name } = req.params;

        if (!name) {
            return res.status(400).json({
                success: false,
                error: '标签名称不能为空'
            });
        }

        // 检查标签是否存在
        const tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(name);
        if (!tag) {
            return res.status(404).json({
                success: false,
                error: '标签不存在'
            });
        }

        // 使用事务删除标签和相关联的歌曲标签关系
        const deleteTagTransaction = db.transaction(() => {
            // 先删除歌曲标签关联
            const deleteSongTags = db.prepare('DELETE FROM song_tags WHERE tag_id = ?');
            deleteSongTags.run(tag.id);

            // 再删除标签
            const deleteTag = db.prepare('DELETE FROM tags WHERE id = ?');
            const result = deleteTag.run(tag.id);

            return result;
        });

        const result = deleteTagTransaction();

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                error: '标签删除失败'
            });
        }

        res.json({
            success: true,
            message: '标签删除成功'
        });

    } catch (error) {
        console.error('删除标签失败:', error);
        res.status(500).json({
            success: false,
            error: '删除标签失败'
        });
    }
});

// 更新标签名称
router.put('/:id', validateId, validateTag, (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const tagName = name.trim();

        // 检查新标签名是否已存在
        const existingTag = db.prepare('SELECT id FROM tags WHERE name = ? AND id != ?').get(tagName, id);
        if (existingTag) {
            return res.status(409).json({
                success: false,
                error: '标签名称已存在'
            });
        }

        // 更新标签
        const updateTag = db.prepare('UPDATE tags SET name = ? WHERE id = ?');
        const result = updateTag.run(tagName, id);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                error: '标签不存在'
            });
        }

        res.json({
            success: true,
            message: '标签更新成功'
        });

    } catch (error) {
        console.error('更新标签失败:', error);
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            res.status(409).json({
                success: false,
                error: '标签名称已存在'
            });
        } else {
            res.status(500).json({
                success: false,
                error: '更新标签失败'
            });
        }
    }
});

module.exports = router;