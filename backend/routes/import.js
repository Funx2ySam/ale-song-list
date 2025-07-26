const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const router = express.Router();
const db = require('../config/database');
const { getOCRInstance } = require('../utils/imageOcr');

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
        // 根据路径判断文件类型
        const isExcelRoute = req.route.path === '/excel';
        const isImageRoute = req.route.path === '/image';
        
        if (isExcelRoute) {
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
        } else if (isImageRoute) {
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
router.post('/excel', upload.single('file'), (req, res) => {
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

        // 验证数据格式 - 只要求歌曲名称列存在
        const requiredColumns = ['歌曲名称'];
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
        let skipped = 0;
        let failed = 0;
        const errors = [];
        const skippedSongs = [];

        const importTransaction = db.transaction(() => {
            // 准备SQL语句
            const checkSongExists = db.prepare('SELECT id FROM songs WHERE title = ? AND artist = ?');
            const insertSong = db.prepare('INSERT INTO songs (title, artist) VALUES (?, ?)');
            const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)');
            const getTagId = db.prepare('SELECT id FROM tags WHERE name = ?');
            const insertSongTag = db.prepare('INSERT OR IGNORE INTO song_tags (song_id, tag_id) VALUES (?, ?)');

            data.forEach((row, index) => {
                try {
                    const title = row['歌曲名称']?.toString().trim();
                    const artist = row['歌手']?.toString().trim() || '';
                    const tagsString = row['标签']?.toString().trim() || '';

                    // 歌名是必填的
                    if (!title) {
                        failed++;
                        errors.push(`第${index + 2}行: 歌曲名称不能为空`);
                        return;
                    }

                    // 检查是否已存在相同歌名和歌手的歌曲
                    const existingSong = checkSongExists.get(title, artist);
                    if (existingSong) {
                        skipped++;
                        skippedSongs.push(`${title}${artist ? ' - ' + artist : ''}`);
                        return;
                    }

                    // 插入新歌曲
                    const songResult = insertSong.run(title, artist);
                    imported++;

                    // 处理标签
                    if (tagsString) {
                        const tags = tagsString.split(/[,，\s]+/).filter(tag => tag.trim());
                        tags.forEach(tagName => {
                            const cleanTagName = tagName.trim();
                            if (cleanTagName) {
                                try {
                                    // 如果标签不存在就新增
                                    insertTag.run(cleanTagName);
                                    
                                    // 获取标签ID并关联到歌曲
                                    const tagResult = getTagId.get(cleanTagName);
                                    if (tagResult) {
                                        insertSongTag.run(songResult.lastInsertRowid, tagResult.id);
                                    }
                                } catch (tagError) {
                                    // 标签处理错误，记录但不影响歌曲导入
                                    console.warn(`标签"${cleanTagName}"处理失败:`, tagError.message);
                                }
                            }
                        });
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
            message: `导入完成: 新增${imported}首，跳过${skipped}首，失败${failed}首`,
            data: {
                imported: imported,
                skipped: skipped,
                failed: failed,
                total: data.length,
                skippedSongs: skippedSongs.slice(0, 10), // 最多显示10首跳过的歌曲
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
router.post('/image', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: '请选择图片文件'
            });
        }

        const imagePath = req.file.path;
        
        // 获取OCR实例
        const ocrInstance = getOCRInstance();
        if (!ocrInstance) {
            // 清理临时文件
            fs.unlinkSync(imagePath);
            return res.status(500).json({
                success: false,
                error: 'OCR服务未配置，请检查环境变量 ALIYUN_ACCESS_KEY_ID 和 ALIYUN_ACCESS_KEY_SECRET'
            });
        }

        // 执行OCR识别
        const ocrResult = await ocrInstance.processImage(imagePath);

        // 清理临时文件
        fs.unlinkSync(imagePath);

        if (!ocrResult.success) {
            return res.status(500).json({
                success: false,
                error: `图片识别失败: ${ocrResult.error}`
            });
        }

        // 如果用户选择直接导入，则保存到数据库
        if (req.body.autoImport === 'true') {
            try {
                let imported = 0;
                let skipped = 0;
                let failed = 0;
                const errors = [];
                const skippedSongs = [];

                const importTransaction = db.transaction(() => {
                    const checkSongExists = db.prepare('SELECT id FROM songs WHERE title = ? AND artist = ?');
                    const insertSong = db.prepare('INSERT INTO songs (title, artist) VALUES (?, ?)');

                    ocrResult.extractedSongs.forEach((song, index) => {
                        try {
                            const title = song.title?.trim();
                            const artist = song.artist?.trim() || '';

                            if (!title) {
                                failed++;
                                errors.push(`第${index + 1}首歌曲: 歌曲名称不能为空`);
                                return;
                            }

                            // 检查是否已存在相同歌名和歌手的歌曲
                            const existingSong = checkSongExists.get(title, artist);
                            if (existingSong) {
                                skipped++;
                                skippedSongs.push(`${title}${artist ? ' - ' + artist : ''}`);
                                return;
                            }

                            // 插入新歌曲
                            insertSong.run(title, artist);
                            imported++;

                        } catch (error) {
                            failed++;
                            errors.push(`第${index + 1}首歌曲: ${error.message}`);
                        }
                    });
                });

                importTransaction();

                res.json({
                    success: true,
                    message: `图片识别并导入完成: 新增${imported}首，跳过${skipped}首，失败${failed}首`,
                    data: {
                        ocrInfo: {
                            confidence: ocrResult.confidence,
                            totalTextLines: ocrResult.totalTextLines,
                            extractedCount: ocrResult.songCount
                        },
                        importInfo: {
                            imported: imported,
                            skipped: skipped,
                            failed: failed,
                            total: ocrResult.extractedSongs.length,
                            skippedSongs: skippedSongs.slice(0, 10),
                            errors: errors.slice(0, 10)
                        },
                        extractedSongs: ocrResult.extractedSongs
                    }
                });

            } catch (importError) {
                console.error('自动导入失败:', importError);
                res.status(500).json({
                    success: false,
                    error: '图片识别成功，但自动导入失败: ' + importError.message,
                    data: {
                        extractedSongs: ocrResult.extractedSongs
                    }
                });
            }
        } else {
            // 只返回识别结果，不自动导入
            res.json({
                success: true,
                message: `图片识别完成，共识别到${ocrResult.songCount}首歌曲`,
                data: {
                    confidence: ocrResult.confidence,
                    totalTextLines: ocrResult.totalTextLines,
                    extractedSongs: ocrResult.extractedSongs,
                    songCount: ocrResult.songCount,
                    note: '请在前端确认后选择导入'
                }
            });
        }

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

// 新增：确认并导入OCR识别的歌曲
router.post('/image/confirm', (req, res) => {
    try {
        const { songs, selectedIndexes } = req.body;

        if (!songs || !Array.isArray(songs)) {
            return res.status(400).json({
                success: false,
                error: '请提供歌曲数据'
            });
        }

        // 如果指定了选择的索引，只导入选中的歌曲
        const songsToImport = selectedIndexes && Array.isArray(selectedIndexes) 
            ? selectedIndexes.map(index => songs[index]).filter(song => song)
            : songs;

        if (songsToImport.length === 0) {
            return res.status(400).json({
                success: false,
                error: '没有选择要导入的歌曲'
            });
        }

        let imported = 0;
        let skipped = 0;
        let failed = 0;
        const errors = [];
        const skippedSongs = [];

        const importTransaction = db.transaction(() => {
            const checkSongExists = db.prepare('SELECT id FROM songs WHERE title = ? AND artist = ?');
            const insertSong = db.prepare('INSERT INTO songs (title, artist) VALUES (?, ?)');

            songsToImport.forEach((song, index) => {
                try {
                    const title = song.title?.trim();
                    const artist = song.artist?.trim() || '';

                    if (!title) {
                        failed++;
                        errors.push(`第${index + 1}首歌曲: 歌曲名称不能为空`);
                        return;
                    }

                    // 检查是否已存在
                    const existingSong = checkSongExists.get(title, artist);
                    if (existingSong) {
                        skipped++;
                        skippedSongs.push(`${title}${artist ? ' - ' + artist : ''}`);
                        return;
                    }

                    // 插入新歌曲
                    insertSong.run(title, artist);
                    imported++;

                } catch (error) {
                    failed++;
                    errors.push(`第${index + 1}首歌曲: ${error.message}`);
                }
            });
        });

        importTransaction();

        res.json({
            success: true,
            message: `确认导入完成: 新增${imported}首，跳过${skipped}首，失败${failed}首`,
            data: {
                imported: imported,
                skipped: skipped,
                failed: failed,
                total: songsToImport.length,
                skippedSongs: skippedSongs.slice(0, 10),
                errors: errors.slice(0, 10)
            }
        });

    } catch (error) {
        console.error('确认导入失败:', error);
        res.status(500).json({
            success: false,
            error: '确认导入失败: ' + error.message
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