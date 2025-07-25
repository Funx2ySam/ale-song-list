const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

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

        // 验证管理密钥
        const adminKey = process.env.ADMIN_KEY || 'admin123';
        if (key !== adminKey) {
            return res.status(401).json({
                success: false,
                error: '管理密钥错误'
            });
        }

        // 生成JWT Token
        const token = jwt.sign(
            { 
                admin: true, 
                loginTime: new Date().toISOString() 
            },
            process.env.JWT_SECRET || 'default-secret',
            { expiresIn: '24h' }
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

        // 验证JWT Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
        
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

module.exports = router;