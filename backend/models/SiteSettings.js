const db = require('../config/database');
const config = require('../config/config');

class SiteSettings {
    // 获取站点设置（合并环境变量默认值和数据库设置）
    static getSiteSettings() {
        const row = db.prepare('SELECT site_title, site_favicon FROM streamers WHERE id = 1').get();
        
        return {
            site_title: (row && row.site_title) || config.site.defaultTitle,
            site_favicon: (row && row.site_favicon) || config.site.defaultFavicon,
            _defaults: {
                title: config.site.defaultTitle,
                favicon: config.site.defaultFavicon,
                adminSuffix: config.site.adminSuffix
            }
        };
    }

    static updateSiteSettings(settings) {
        const { site_title, site_favicon } = settings;
        
        const row = db.prepare('SELECT id FROM streamers WHERE id = 1').get();
        
        if (row) {
            const updateStmt = db.prepare('UPDATE streamers SET site_title = ?, site_favicon = ? WHERE id = 1');
            updateStmt.run(site_title, site_favicon);
        } else {
            const insertStmt = db.prepare('INSERT INTO streamers (name, description, site_title, site_favicon) VALUES (?, ?, ?, ?)');
            insertStmt.run(
                'Default Streamer',
                '欢迎来到我的歌单系统',
                site_title || config.site.defaultTitle,
                site_favicon || config.site.defaultFavicon
            );
        }
        
        return { success: true };
    }

    static resetToDefaults() {
        return this.updateSiteSettings({
            site_title: config.site.defaultTitle,
            site_favicon: config.site.defaultFavicon
        });
    }
}

module.exports = SiteSettings; 