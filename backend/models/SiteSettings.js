const db = require('../config/database');
const config = require('../config/config');

class SiteSettings {
    // 获取站点设置（合并环境变量默认值和数据库设置）
    static getSiteSettings() {
        try {
            const row = db.prepare('SELECT site_title, site_favicon FROM streamers WHERE id = 1').get();
            
            // 如果数据库中没有设置，使用配置文件的默认值
            const settings = {
                site_title: (row && row.site_title) || config.site.defaultTitle,
                site_favicon: (row && row.site_favicon) || config.site.defaultFavicon,
                // 同时返回默认值，便于前端了解系统默认配置
                _defaults: {
                    title: config.site.defaultTitle,
                    favicon: config.site.defaultFavicon,
                    adminSuffix: config.site.adminSuffix
                }
            };
            
            return Promise.resolve(settings);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    // 更新站点设置
    static updateSiteSettings(settings) {
        try {
            const { site_title, site_favicon } = settings;
            
            // 检查是否存在记录
            const row = db.prepare('SELECT id FROM streamers WHERE id = 1').get();
            
            if (row) {
                // 更新现有记录
                const updateStmt = db.prepare('UPDATE streamers SET site_title = ?, site_favicon = ? WHERE id = 1');
                updateStmt.run(site_title, site_favicon);
            } else {
                // 创建新记录，使用配置默认值作为基础
                const insertStmt = db.prepare('INSERT INTO streamers (name, description, site_title, site_favicon) VALUES (?, ?, ?, ?)');
                insertStmt.run(
                    'Default Streamer',
                    '欢迎来到我的歌单系统',
                    site_title || config.site.defaultTitle,
                    site_favicon || config.site.defaultFavicon
                );
            }
            
            return Promise.resolve({ success: true });
        } catch (error) {
            return Promise.reject(error);
        }
    }

    // 重置站点设置为环境变量默认值
    static resetToDefaults() {
        try {
            const settings = {
                site_title: config.site.defaultTitle,
                site_favicon: config.site.defaultFavicon
            };
            return this.updateSiteSettings(settings);
        } catch (error) {
            return Promise.reject(error);
        }
    }
}

module.exports = SiteSettings; 