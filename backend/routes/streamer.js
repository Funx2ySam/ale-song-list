const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const db = require('../config/database');
const { validateStreamerProfile, validateFileUpload } = require('../middleware/validation');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// 配置文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../frontend/uploads');
        let subDir = 'temp';
        
        if (file.fieldname === 'avatar') {
            subDir = 'avatars';
        } else if (file.fieldname === 'background') {
            subDir = 'backgrounds';
        }
        
        const fullPath = path.join(uploadDir, subDir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }
        
        cb(null, fullPath);
    },
    filename: function (req, file, cb) {
        // 生成唯一文件名
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
        // 只允许图片文件
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件'));
        }
    }
});

// 获取用户信息（公开接口）
router.get('/profile', (req, res) => {
    try {
        const profile = db.prepare('SELECT * FROM streamers WHERE id = 1').get();
        
        if (!profile) {
            return res.status(404).json({
                success: false,
                error: '用户信息不存在'
            });
        }

        res.json({
            success: true,
            data: {
                name: profile.name,
                description: profile.description,
                avatar: profile.avatar,
                background: profile.background,
                created_at: profile.created_at
            }
        });

    } catch (error) {
        console.error('获取用户信息失败:', error);
        res.status(500).json({
            success: false,
            error: '获取用户信息失败'
        });
    }
});

// 以下接口需要身份验证
router.use(authenticateToken);
router.use(requireAdmin);

// 更新用户基本信息
router.put('/profile', validateStreamerProfile, (req, res) => {
    try {
        const { name, description } = req.body;

        const updateProfile = db.prepare(`
            UPDATE streamers 
            SET name = ?, description = ? 
            WHERE id = 1
        `);

        const result = updateProfile.run(name, description);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                error: '用户信息更新失败'
            });
        }

        res.json({
            success: true,
            message: '用户信息更新成功'
        });

    } catch (error) {
        console.error('更新用户信息失败:', error);
        res.status(500).json({
            success: false,
            error: '更新用户信息失败'
        });
    }
});

// 上传头像
router.post('/avatar', upload.single('avatar'), validateFileUpload('avatar'), (req, res) => {
    try {
        // 构建文件URL
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;

        // 更新数据库
        const updateAvatar = db.prepare(`
            UPDATE streamers 
            SET avatar = ? 
            WHERE id = 1
        `);

        updateAvatar.run(avatarUrl);

        res.json({
            success: true,
            message: '头像上传成功',
            avatar: avatarUrl
        });

    } catch (error) {
        console.error('头像上传失败:', error);
        res.status(500).json({
            success: false,
            error: '头像上传失败'
        });
    }
});

// 上传背景图
router.post('/background', upload.single('background'), validateFileUpload('background'), (req, res) => {
    try {
        // 构建文件URL
        const backgroundUrl = `/uploads/backgrounds/${req.file.filename}`;

        // 更新数据库
        const updateBackground = db.prepare(`
            UPDATE streamers 
            SET background = ? 
            WHERE id = 1
        `);

        updateBackground.run(backgroundUrl);

        res.json({
            success: true,
            message: '背景图片上传成功',
            background_url: backgroundUrl
        });

    } catch (error) {
        console.error('背景图片上传失败:', error);
        res.status(500).json({
            success: false,
            error: '背景图片上传失败'
        });
    }
});

module.exports = router;