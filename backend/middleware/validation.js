const validator = require('validator');

// 通用验证函数
const validateRequired = (value, fieldName) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
        return `${fieldName}不能为空`;
    }
    return null;
};

const validateLength = (value, fieldName, min = 0, max = 255) => {
    if (value && (value.length < min || value.length > max)) {
        return `${fieldName}长度必须在${min}-${max}个字符之间`;
    }
    return null;
};

const validateEmail = (email) => {
    if (email && !validator.isEmail(email)) {
        return '邮箱格式不正确';
    }
    return null;
};

const validateUrl = (url) => {
    if (url && !validator.isURL(url)) {
        return 'URL格式不正确';
    }
    return null;
};

// 歌曲验证
const validateSong = (req, res, next) => {
    const { title, artist, tags } = req.body;
    const errors = [];

    // 验证标题
    const titleError = validateRequired(title, '歌曲名称');
    if (titleError) errors.push(titleError);
    else {
        const titleLengthError = validateLength(title, '歌曲名称', 1, 100);
        if (titleLengthError) errors.push(titleLengthError);
    }

    // 验证歌手
    const artistError = validateRequired(artist, '歌手名称');
    if (artistError) errors.push(artistError);
    else {
        const artistLengthError = validateLength(artist, '歌手名称', 1, 100);
        if (artistLengthError) errors.push(artistLengthError);
    }

    // 验证标签
    if (tags && Array.isArray(tags)) {
        tags.forEach((tag, index) => {
            if (tag && typeof tag === 'string') {
                const tagLengthError = validateLength(tag, `标签${index + 1}`, 1, 50);
                if (tagLengthError) errors.push(tagLengthError);
            }
        });
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: errors.join('; ')
        });
    }

    next();
};

// 标签验证
const validateTag = (req, res, next) => {
    const { name } = req.body;
    const errors = [];

    // 验证标签名称
    const nameError = validateRequired(name, '标签名称');
    if (nameError) errors.push(nameError);
    else {
        const nameLengthError = validateLength(name, '标签名称', 1, 50);
        if (nameLengthError) errors.push(nameLengthError);
        
        // 验证标签名称不包含特殊字符
        if (name.trim() && !/^[\u4e00-\u9fa5a-zA-Z0-9\s&-]+$/.test(name.trim())) {
            errors.push('标签名称只能包含中文、英文、数字、空格、&和-字符');
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: errors.join('; ')
        });
    }

    next();
};

// 主播信息验证
const validateStreamerProfile = (req, res, next) => {
    const { name, description } = req.body;
    const errors = [];

    // 验证主播名称
    const nameError = validateRequired(name, '主播名称');
    if (nameError) errors.push(nameError);
    else {
        const nameLengthError = validateLength(name, '主播名称', 1, 50);
        if (nameLengthError) errors.push(nameLengthError);
    }

    // 验证描述
    if (description) {
        const descLengthError = validateLength(description, '个人简介', 0, 500);
        if (descLengthError) errors.push(descLengthError);
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: errors.join('; ')
        });
    }

    next();
};

// 文件上传验证
const validateFileUpload = (fieldName, allowedTypes = ['image/jpeg', 'image/png', 'image/gif'], maxSize = 10 * 1024 * 1024) => {
    return (req, res, next) => {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: '请选择要上传的文件'
            });
        }

        // 验证文件类型
        if (!allowedTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                success: false,
                error: `只允许上传以下类型的文件: ${allowedTypes.join(', ')}`
            });
        }

        // 验证文件大小
        if (req.file.size > maxSize) {
            return res.status(400).json({
                success: false,
                error: `文件大小不能超过 ${Math.round(maxSize / 1024 / 1024)}MB`
            });
        }

        next();
    };
};

// ID参数验证
const validateId = (req, res, next) => {
    const { id } = req.params;
    
    if (!id || !validator.isInt(id.toString(), { min: 1 })) {
        return res.status(400).json({
            success: false,
            error: 'ID参数无效'
        });
    }

    next();
};

// 分页参数验证
const validatePagination = (req, res, next) => {
    const { page = 1, limit = 20 } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (isNaN(pageNum) || pageNum < 1) {
        return res.status(400).json({
            success: false,
            error: '页码必须是大于0的整数'
        });
    }
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
            success: false,
            error: '每页数量必须是1-100之间的整数'
        });
    }
    
    req.pagination = { page: pageNum, limit: limitNum };
    next();
};

// 搜索参数验证
const validateSearch = (req, res, next) => {
    const { search, tag } = req.query;
    
    if (search && search.length > 100) {
        return res.status(400).json({
            success: false,
            error: '搜索关键词长度不能超过100个字符'
        });
    }
    
    if (tag && tag.length > 50) {
        return res.status(400).json({
            success: false,
            error: '标签筛选条件长度不能超过50个字符'
        });
    }
    
    next();
};

module.exports = {
    validateSong,
    validateTag,
    validateStreamerProfile,
    validateFileUpload,
    validateId,
    validatePagination,
    validateSearch,
    validateRequired,
    validateLength,
    validateEmail,
    validateUrl
};