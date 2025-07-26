const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const SiteSettings = require('../models/SiteSettings');
const { authenticateToken } = require('../middleware/auth');

// 配置 favicon 上传
const faviconStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../frontend/uploads/favicon');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // 固定文件名，便于引用
        const ext = path.extname(file.originalname);
        cb(null, `favicon-${Date.now()}${ext}`);
    }
});

const uploadFavicon = multer({
    storage: faviconStorage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|ico|svg/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('只支持图片文件作为网站图标'));
        }
    }
});

// 获取站点设置
router.get('/settings', async (req, res) => {
    try {
        const settings = await SiteSettings.getSiteSettings();
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('获取站点设置失败:', error);
        res.status(500).json({
            success: false,
            message: '获取站点设置失败'
        });
    }
});

// 更新站点设置
router.put('/settings', authenticateToken, async (req, res) => {
    try {
        const { site_title } = req.body;
        
        if (!site_title || site_title.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: '站点标题不能为空'
            });
        }

        // 获取当前设置
        const currentSettings = await SiteSettings.getSiteSettings();
        
        const settings = {
            site_title: site_title.trim(),
            site_favicon: currentSettings.site_favicon // 保持当前图标
        };

        await SiteSettings.updateSiteSettings(settings);

        res.json({
            success: true,
            message: '站点设置更新成功',
            data: settings
        });
    } catch (error) {
        console.error('更新站点设置失败:', error);
        res.status(500).json({
            success: false,
            message: '更新站点设置失败'
        });
    }
});

// 上传站点图标
router.post('/favicon', authenticateToken, uploadFavicon.single('favicon'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '请选择要上传的图标文件'
            });
        }

        const faviconPath = `/uploads/favicon/${req.file.filename}`;
        
        // 获取当前设置
        const currentSettings = await SiteSettings.getSiteSettings();
        
        // 删除旧的图标文件
        if (currentSettings.site_favicon) {
            const oldPath = path.join(__dirname, '../../frontend', currentSettings.site_favicon);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        // 更新数据库
        const settings = {
            site_title: currentSettings.site_title || '歌单系统',
            site_favicon: faviconPath
        };

        await SiteSettings.updateSiteSettings(settings);

        res.json({
            success: true,
            message: '站点图标上传成功',
            data: {
                favicon_url: faviconPath
            }
        });
    } catch (error) {
        console.error('上传站点图标失败:', error);
        res.status(500).json({
            success: false,
            message: '上传站点图标失败'
        });
    }
});

// 删除站点图标
router.delete('/favicon', authenticateToken, async (req, res) => {
    try {
        // 获取当前设置
        const currentSettings = await SiteSettings.getSiteSettings();
        
        // 删除图标文件
        if (currentSettings.site_favicon) {
            const faviconPath = path.join(__dirname, '../../frontend', currentSettings.site_favicon);
            if (fs.existsSync(faviconPath)) {
                fs.unlinkSync(faviconPath);
            }
        }

        // 更新数据库
        const settings = {
            site_title: currentSettings.site_title,
            site_favicon: null
        };

        await SiteSettings.updateSiteSettings(settings);

        res.json({
            success: true,
            message: '站点图标删除成功'
        });
    } catch (error) {
        console.error('删除站点图标失败:', error);
        res.status(500).json({
            success: false,
            message: '删除站点图标失败'
        });
    }
});

// 重置站点设置为环境变量默认值
router.post('/reset', authenticateToken, async (req, res) => {
    try {
        // 获取当前设置，删除自定义的favicon文件
        const currentSettings = await SiteSettings.getSiteSettings();
        
        // 如果有自定义favicon且不是默认的base64图标，删除文件
        if (currentSettings.site_favicon && 
            currentSettings.site_favicon.startsWith('/uploads/') &&
            !currentSettings.site_favicon.startsWith('data:')) {
            const faviconPath = path.join(__dirname, '../../frontend', currentSettings.site_favicon);
            if (fs.existsSync(faviconPath)) {
                fs.unlinkSync(faviconPath);
            }
        }

        // 重置为默认值
        await SiteSettings.resetToDefaults();

        // 获取重置后的设置
        const resetSettings = await SiteSettings.getSiteSettings();

        res.json({
            success: true,
            message: '站点设置已重置为默认值',
            data: resetSettings
        });
    } catch (error) {
        console.error('重置站点设置失败:', error);
        res.status(500).json({
            success: false,
            message: '重置站点设置失败'
        });
    }
});

module.exports = router; 