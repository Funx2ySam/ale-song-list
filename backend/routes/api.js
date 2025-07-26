const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// 健康检查接口
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'API服务正常运行'
    });
});

// 身份验证相关（公开）
router.use('/auth', require('./auth'));

// 公开API - 不需要身份验证，直接使用路由文件
router.use('/songs', require('./songs'));
router.use('/tags', require('./tags'));
router.use('/streamer', require('./streamer'));

// 需要身份验证的API（导入功能）
router.use('/import', authenticateToken, requireAdmin, require('./import'));
router.use('/songs/import', authenticateToken, requireAdmin, require('./import'));

module.exports = router;