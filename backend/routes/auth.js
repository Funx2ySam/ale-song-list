const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();

let runtimeAdminKey = config.admin.secretKey;

// 管理员登录
router.post('/login', (req, res) => {
    try {
        const { key } = req.body;
        
        if (!key) {
            return res.status(400).json({
                success: false,
                error: '请输入管理密钥'
            });
        }

        const adminKey = runtimeAdminKey || config.admin.secretKey;
        if (!adminKey) {
            return res.status(500).json({
                success: false,
                error: '管理密钥未配置，请设置环境变量 ADMIN_SECRET_KEY'
            });
        }
        if (key !== adminKey) {
            return res.status(401).json({
                success: false,
                error: '管理密钥错误'
            });
        }

        const token = jwt.sign(
            { 
                admin: true, 
                loginTime: new Date().toISOString() 
            },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        res.json({
            success: true,
            message: '登录成功',
            token: token,
            expiresIn: '24h'
        });

    } catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
});

// 验证token
router.get('/verify', (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                error: '未提供认证token'
            });
        }

        const decoded = jwt.verify(token, config.jwt.secret);
        
        res.json({
            success: true,
            valid: true,
            user: {
                admin: decoded.admin,
                loginTime: decoded.loginTime
            }
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            res.status(401).json({
                success: false,
                error: 'Token已过期，请重新登录'
            });
        } else if (error.name === 'JsonWebTokenError') {
            res.status(401).json({
                success: false,
                error: '无效的token'
            });
        } else {
            console.error('Token验证失败:', error);
            res.status(500).json({
                success: false,
                error: '服务器内部错误'
            });
        }
    }
});

// 登出（客户端清除token即可）
router.post('/logout', (req, res) => {
    res.json({
        success: true,
        message: '已登出'
    });
});

// 更新管理密钥
router.put('/change-key', (req, res) => {
    try {
        const { currentKey, newKey } = req.body;

        if (!currentKey || !newKey) {
            return res.status(400).json({
                success: false,
                error: '请提供当前密钥和新密钥'
            });
        }

        if (newKey.length < 6) {
            return res.status(400).json({
                success: false,
                error: '新密钥长度至少6位'
            });
        }

        const adminKey = runtimeAdminKey || config.admin.secretKey;
        if (!adminKey || currentKey !== adminKey) {
            return res.status(400).json({
                success: false,
                error: '当前密钥不正确'
            });
        }

        runtimeAdminKey = newKey;

        res.json({
            success: true,
            message: '管理密钥修改成功，建议重新登录'
        });

    } catch (error) {
        console.error('修改管理密钥失败:', error);
        res.status(500).json({
            success: false,
            error: '修改管理密钥失败'
        });
    }
});

module.exports = router;