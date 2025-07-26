const config = require('../config/config');
const logger = require('./logger');
const fs = require('fs');

class ImageOCR {
    constructor() {
        this.client = null;
        this.isSimulationMode = false;
        this.initClient();
    }

    /**
     * 初始化OCR客户端
     */
    initClient() {
        try {
            if (!config.ocr.aliyun.accessKeyId || !config.ocr.aliyun.accessKeySecret) {
                logger.warn('阿里云OCR配置不完整，使用模拟模式');
                this.isSimulationMode = true;
                return;
            }

            // 尝试初始化真实的阿里云OCR客户端
            this.initRealOCR();
            
        } catch (error) {
            logger.error('OCR客户端初始化失败，切换到模拟模式:', error);
            this.isSimulationMode = true;
        }
    }

    /**
     * 初始化真实的阿里云OCR客户端 - 使用官方示例代码格式
     */
    initRealOCR() {
        try {
            logger.info('正在初始化阿里云OCR客户端...');
            
            // 按照官方示例导入模块
            const ocr_api20210707 = require('@alicloud/ocr-api20210707');
            const OpenApi = require('@alicloud/openapi-client');
            
            logger.info('SDK模块导入成功');

            // 创建配置对象 - 按照官方格式
            const openApiConfig = new OpenApi.Config({
                accessKeyId: config.ocr.aliyun.accessKeyId,
                accessKeySecret: config.ocr.aliyun.accessKeySecret,
                endpoint: config.ocr.aliyun.endpoint || 'ocr-api.cn-hangzhou.aliyuncs.com'
            });
            
            logger.info('配置对象创建成功，endpoint:', openApiConfig.endpoint);

            // 使用 .default 创建OCR客户端（关键修正！）
            this.client = new ocr_api20210707.default(openApiConfig);
            this.ocrModule = ocr_api20210707; // 保存模块引用用于创建请求
            this.isSimulationMode = false;
            
            logger.info('阿里云OCR客户端初始化成功（真实API模式）');
            
            // 测试客户端是否可用
            if (this.client && typeof this.client.recognizeGeneralWithOptions === 'function') {
                logger.info('OCR客户端功能验证成功');
            } else {
                throw new Error('OCR客户端创建失败或缺少必要方法');
            }
            
        } catch (error) {
            logger.error('真实OCR API初始化失败:', error.message);
            logger.error('错误堆栈:', error.stack);
            logger.warn('切换到模拟模式');
            this.isSimulationMode = true;
        }
    }

    /**
     * 识别图片中的文字
     * @param {string} imagePath - 图片文件路径
     * @returns {Promise<Object>} OCR识别结果
     */
    async recognizeText(imagePath) {
        try {
            if (!fs.existsSync(imagePath)) {
                throw new Error('图片文件不存在');
            }

            if (this.isSimulationMode) {
                return this.simulateOCR(imagePath);
            } else {
                return this.realOCR(imagePath);
            }

        } catch (error) {
            logger.error('OCR识别失败，尝试切换到模拟模式:', error);
            
            // 如果真实API失败，尝试模拟模式
            if (!this.isSimulationMode) {
                this.isSimulationMode = true;
                return this.simulateOCR(imagePath);
            }
            
            return {
                success: false,
                error: error.message,
                textLines: []
            };
        }
    }

    /**
     * 真实的阿里云OCR识别 - 使用官方示例调用方式
     */
    async realOCR(imagePath) {
        try {
            logger.info('开始OCR识别（真实API）');

            // 尝试使用文件流（SDK期望的格式）
            const imageStream = fs.createReadStream(imagePath);
            logger.info('创建文件流成功，路径:', imagePath);

            // 使用文件流作为body
            const recognizeGeneralRequest = new this.ocrModule.RecognizeGeneralRequest({
                body: imageStream
            });

            // 创建运行时选项
            const Util = require('@alicloud/tea-util');
            const runtime = new Util.RuntimeOptions({});

            logger.info('发送OCR请求...');
            logger.info('请求对象:', JSON.stringify({
                bodyType: typeof recognizeGeneralRequest.body,
                hasBody: !!recognizeGeneralRequest.body,
                isStream: recognizeGeneralRequest.body && typeof recognizeGeneralRequest.body.pipe === 'function'
            }));

            // 使用正确的方法名 recognizeGeneralWithOptions
            let response;
            try {
                response = await this.client.recognizeGeneralWithOptions(recognizeGeneralRequest, runtime);
                logger.info('API调用成功');
            } catch (apiError) {
                logger.error('API调用错误:', apiError.message);
                logger.error('错误类型:', typeof apiError);
                logger.error('错误对象:', apiError);
                throw apiError;
            }
            
            logger.info('收到OCR响应:', JSON.stringify(response, null, 2));
            
            // 处理阿里云OCR API的响应格式
            let textLines = [];
            let confidence = 0.8;
            
            if (response && response.body && response.body.data) {
                try {
                    // body.data 是一个JSON字符串，需要解析
                    const ocrData = JSON.parse(response.body.data);
                    logger.info('解析OCR数据成功，文字块数量:', ocrData.prism_wnum);
                    
                    // 使用 prism_wordsInfo 数组，这是标准的文字块信息
                    if (ocrData.prism_wordsInfo && Array.isArray(ocrData.prism_wordsInfo)) {
                        textLines = ocrData.prism_wordsInfo.map(item => ({
                            text: item.word,
                            confidence: item.prob || 99,
                            position: item.pos,
                            angle: item.angle
                        }));
                        confidence = 0.9; // 使用高置信度，因为这是真实API
                    }
                    
                    logger.info('成功转换文字块:', textLines.length, '个');
                    
                } catch (parseError) {
                    logger.error('解析OCR响应数据失败:', parseError);
                    logger.error('原始data:', response.body.data);
                    textLines = [];
                }
            }
            
            logger.info('OCR识别成功（真实API），识别到文字行数:', textLines.length);

            return {
                success: true,
                confidence: confidence,
                textLines: textLines,
                rawResponse: response.body || response
            };
            
        } catch (error) {
            logger.error('真实OCR API调用失败:', error.message);
            logger.error('错误详情:', error);
            
            // 按照官方示例处理错误
            if (error.data && error.data["Recommend"]) {
                logger.error('诊断建议:', error.data["Recommend"]);
            }
            if (error.code) {
                logger.error('错误代码:', error.code);
            }
            
            throw error;
        }
    }

    /**
     * 模拟OCR识别
     */
    async simulateOCR(imagePath) {
        logger.info('开始OCR识别（模拟模式）');
        
        // 模拟一些常见的歌单文字识别结果
        const mockTextLines = [
            { text: '1. 起风了 - 买辣椒也用券' },
            { text: '2. 夜曲 - 周杰伦' },
            { text: '3. 告白气球 - 周杰伦' },
            { text: '4. 稻香 - 周杰伦' },
            { text: '5. 七里香 - 周杰伦' },
            { text: '6. 青花瓷 - 周杰伦' },
            { text: '7. 演员 - 薛之谦' },
            { text: '8. 体面 - 于文文' },
            { text: '9. 成都 - 赵雷' },
            { text: '10. 理想 - 赵雷' }
        ];

        logger.info('OCR识别成功（模拟模式），识别到文字行数:', mockTextLines.length);

        return {
            success: true,
            confidence: 0.9,
            textLines: mockTextLines,
            rawResponse: { Data: { Content: mockTextLines } }
        };
    }

    /**
     * 从OCR识别的文字中提取歌曲信息
     * @param {Array} textLines - OCR识别的文字行
     * @returns {Array} 提取的歌曲列表
     */
    extractSongs(textLines) {
        const songs = [];
        const processedTexts = new Set(); // 用于去重

        try {
            for (const line of textLines) {
                // 兼容不同的文字字段格式
                const text = line.text?.trim() || line.Text?.trim() || line.content?.trim() || (typeof line === 'string' ? line.trim() : '');
                if (!text || text.length < 1) continue;
                
                // logger.debug(`处理文本: "${text}"`); // 太多日志，暂时注释

                // 跳过已处理的文本
                if (processedTexts.has(text)) continue;
                processedTexts.add(text);

                // 尝试不同的歌曲信息提取模式
                const extractedSong = this.parseSongFromText(text);
                if (extractedSong) {
                    logger.info(`提取歌曲: "${extractedSong.title}" - "${extractedSong.artist}" (置信度: ${extractedSong.confidence})`);
                    songs.push(extractedSong);
                }
            }

            logger.info(`从OCR文字中提取到${songs.length}首歌曲`);
            return songs;

        } catch (error) {
            logger.error('歌曲信息提取失败:', error);
            return [];
        }
    }

    /**
     * 从单行文字中解析歌曲信息
     * @param {string} text - 文字内容
     * @returns {Object|null} 歌曲信息
     */
    parseSongFromText(text) {
        // 过滤掉明显不是歌曲信息的文字
        const excludePatterns = [
            /^\d+$/,                           // 纯数字
            /^[\u4e00-\u9fa5]{1}$/,           // 单个汉字
            /^[，。！？、；：""''（）【】\s]+$/, // 纯标点符号
            /^(第|页|共|总|合计|小计|歌单|播放列表)/,    // 页码等信息
            /^(时间|日期|年|月|日|点|分|秒)/,           // 时间信息
            /^(扫码|关注|订阅|点赞|收藏)/,            // 社交媒体相关
            /^(欧美|中文|英文|韩文|日文|粤语|说唱|流行|摇滚|民谣|电子|古典)[:：]/, // 音乐分类标签
            /^(Genre|Category|Type)[:：]/i,     // 英文分类标签
            /^\d{2}[:：]\d{2}$/,              // 时间格式 如 "02:20"
        ];

        // 特殊处理：常见的短歌名不应被过滤
        const commonShortSongs = ['UP', 'GO', 'ON', 'NO', 'HI', 'WE', 'MY', 'SO'];
        const isCommonShortSong = commonShortSongs.includes(text.toUpperCase());
        
        // 如果是常见短歌名，直接返回高置信度结果
        if (isCommonShortSong) {
            return {
                title: text,
                artist: '',
                confidence: 0.8
            };
        }
        
        // 应用过滤规则（常见短歌名已经在上面处理了）
        for (const pattern of excludePatterns) {
            if (pattern.test(text)) {
                // logger.debug(`过滤文本: "${text}" (匹配规则: ${pattern})`); // 调试用
                return null;
            }
        }

        // 常见的歌名-歌手分隔符
        const separators = [' - ', '－', '—', ' — ', ' / ', '/', '  ', '\t', ' — '];
        
        for (const separator of separators) {
            if (text.includes(separator)) {
                const parts = text.split(separator).map(part => part.trim()).filter(part => part);
                if (parts.length >= 2) {
                    // 移除开头的数字编号
                    let title = parts[0].replace(/^\d+[\.\)、]\s*/, '').trim();
                    let artist = parts[1].trim();
                    
                    // 放宽歌名长度限制，允许1字符的歌名（如"UP"）
                    if (title.length >= 1 && title.length <= 50) {
                        return {
                            title: title,
                            artist: artist,
                            confidence: 0.8
                        };
                    }
                }
            }
        }

        // 如果没有明显的分隔符，但文字长度合理，作为歌名处理
        if (text.length >= 1 && text.length <= 30) {
            // 检查是否包含数字编号（如 "1. 歌名"）
            const numberMatch = text.match(/^(\d+[\.\)、])\s*(.+)$/);
            if (numberMatch) {
                const songTitle = numberMatch[2].trim();
                // 放宽长度限制，允许短歌名
                if (songTitle.length >= 1 && songTitle.length <= 50) {
                    return {
                        title: songTitle,
                        artist: '',
                        confidence: 0.6
                    };
                }
            } else {
                // 直接作为歌名，但置信度较低，特别处理极短歌名
                const confidence = text.length <= 3 ? 0.7 : 0.5; // 短歌名给稍高置信度
                
                return {
                    title: text,
                    artist: '',
                    confidence: confidence
                };
            }
        }

        return null;
    }

    /**
     * 处理图片并提取歌曲信息（主要接口）
     * @param {string} imagePath - 图片文件路径
     * @returns {Promise<Object>} 处理结果
     */
    async processImage(imagePath) {
        try {
            // OCR识别
            const ocrResult = await this.recognizeText(imagePath);
            
            if (!ocrResult.success) {
                return {
                    success: false,
                    error: ocrResult.error,
                    songs: []
                };
            }

            // 提取歌曲信息
            const songs = this.extractSongs(ocrResult.textLines);

            return {
                success: true,
                confidence: ocrResult.confidence,
                totalTextLines: ocrResult.textLines.length,
                extractedSongs: songs,
                songCount: songs.length,
                mode: this.isSimulationMode ? 'simulation' : 'real'
            };

        } catch (error) {
            logger.error('图片处理失败:', error);
            return {
                success: false,
                error: error.message,
                songs: []
            };
        }
    }

    /**
     * 获取当前模式
     */
    getMode() {
        return this.isSimulationMode ? 'simulation' : 'real';
    }
}

// 创建单例实例
let ocrInstance = null;

function getOCRInstance() {
    try {
        if (!ocrInstance) {
            ocrInstance = new ImageOCR();
        }
        return ocrInstance;
    } catch (error) {
        logger.warn('OCR实例创建失败:', error.message);
        return null;
    }
}

module.exports = {
    ImageOCR,
    getOCRInstance
};
