const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const router = express.Router();
const db = require('../config/database');

// 配置文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../frontend/uploads/temp');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB
    },
    fileFilter: function (req, file, cb) {
        if (file.fieldname === 'excel') {
            // Excel文件
            const allowedTypes = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
                'application/vnd.ms-excel' // .xls
            ];
            if (allowedTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('只允许上传Excel文件(.xlsx, .xls)'));
            }
        } else if (file.fieldname === 'image') {
            // 图片文件
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('只允许上传图片文件'));
            }
        } else {
            cb(new Error('不支持的文件类型'));
        }
    }
});

// Excel导入
router.post('/excel', upload.single('excel'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: '请选择Excel文件'
            });
        }

        // 读取Excel文件
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // 转换为JSON数组
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            // 清理临时文件
            fs.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                error: 'Excel文件中没有数据'
            });
        }

        // 验证数据格式
        const requiredColumns = ['歌曲名称', '歌手'];
        const firstRow = data[0];
        const missingColumns = requiredColumns.filter(col => !(col in firstRow));

        if (missingColumns.length > 0) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                error: `Excel文件缺少必要列: ${missingColumns.join(', ')}`
            });
        }

        // 处理导入数据
        let imported = 0;
        let failed = 0;
        const errors = [];

        const importTransaction = db.transaction(() => {
            const insertSong = db.prepare('INSERT OR IGNORE INTO songs (title, artist) VALUES (?, ?)');
            const insertSongTag = db.prepare(`
                INSERT INTO song_tags (song_id, tag_id) 
                SELECT ?, id FROM tags WHERE name = ?
            `);

            data.forEach((row, index) => {
                try {
                    const title = row['歌曲名称']?.toString().trim();
                    const artist = row['歌手']?.toString().trim();
                    const tagsString = row['标签']?.toString().trim() || '';

                    if (!title || !artist) {
                        failed++;
                        errors.push(`第${index + 2}行: 歌曲名称或歌手不能为空`);
                        return;
                    }

                    // 插入歌曲
                    const result = insertSong.run(title, artist);
                    
                    if (result.changes > 0) {
                        imported++;
                        
                        // 处理标签
                        if (tagsString) {
                            const tags = tagsString.split(/[,，\s]+/).filter(tag => tag.trim());
                            tags.forEach(tagName => {
                                try {
                                    insertSongTag.run(result.lastInsertRowid, tagName.trim());
                                } catch (tagError) {
                                    // 标签不存在，忽略
                                }
                            });
                        }
                    } else {
                        // 歌曲已存在
                        failed++;
                        errors.push(`第${index + 2}行: 歌曲"${title} - ${artist}"已存在`);
                    }

                } catch (error) {
                    failed++;
                    errors.push(`第${index + 2}行: ${error.message}`);
                }
            });
        });

        importTransaction();

        // 清理临时文件
        fs.unlinkSync(req.file.path);

        res.json({
            success: true,
            message: `导入完成: 成功${imported}首，失败${failed}首`,
            data: {
                imported: imported,
                failed: failed,
                total: data.length,
                errors: errors.slice(0, 10) // 最多返回10个错误信息
            }
        });

    } catch (error) {
        // 清理临时文件
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        console.error('Excel导入失败:', error);
        res.status(500).json({
            success: false,
            error: 'Excel导入失败: ' + error.message
        });
    }
});

// 图片识别导入（OCR功能）
router.post('/image', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: '请选择图片文件'
            });
        }

        // 这里应该调用OCR服务
        // 目前返回模拟数据
        const mockOcrResult = [
            { title: '起风了', artist: '买辣椒也用券' },
            { title: '夜曲', artist: '周杰伦' },
            { title: '告白气球', artist: '周杰伦' }
        ];

        // 清理临时文件
        fs.unlinkSync(req.file.path);

        res.json({
            success: true,
            message: '图片识别完成（模拟数据）',
            data: {
                extracted_songs: mockOcrResult,
                confidence: 0.85,
                note: '这是模拟数据，实际项目中需要接入OCR服务'
            }
        });

    } catch (error) {
        // 清理临时文件
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        console.error('图片识别失败:', error);
        res.status(500).json({
            success: false,
            error: '图片识别失败: ' + error.message
        });
    }
});

// 下载Excel模板
router.get('/template', (req, res) => {
    try {
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
            }
        ];

        // 创建工作簿
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(templateData);

        // 设置列宽
        worksheet['!cols'] = [
            { wch: 20 }, // 歌曲名称
            { wch: 15 }, // 歌手
            { wch: 25 }  // 标签
        ];

        // 添加工作表
        XLSX.utils.book_append_sheet(workbook, worksheet, '歌曲列表');

        // 生成Buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // 设置响应头
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="songlist-template.xlsx"');

        res.send(buffer);

    } catch (error) {
        console.error('生成模板失败:', error);
        res.status(500).json({
            success: false,
            error: '生成模板失败'
        });
    }
});

// 批量删除导入记录（可选功能）
router.delete('/batch', (req, res) => {
    try {
        const { songIds } = req.body;

        if (!songIds || !Array.isArray(songIds) || songIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: '请提供要删除的歌曲ID数组'
            });
        }

        // 使用事务批量删除
        const batchDeleteTransaction = db.transaction(() => {
            const deleteSongTags = db.prepare('DELETE FROM song_tags WHERE song_id = ?');
            const deleteSong = db.prepare('DELETE FROM songs WHERE id = ?');

            let deleted = 0;
            songIds.forEach(id => {
                deleteSongTags.run(id);
                const result = deleteSong.run(id);
                if (result.changes > 0) {
                    deleted++;
                }
            });

            return deleted;
        });

        const deletedCount = batchDeleteTransaction();

        res.json({
            success: true,
            message: `成功删除${deletedCount}首歌曲`,
            data: {
                deleted: deletedCount,
                total: songIds.length
            }
        });

    } catch (error) {
        console.error('批量删除失败:', error);
        res.status(500).json({
            success: false,
            error: '批量删除失败'
        });
    }
});

module.exports = router;