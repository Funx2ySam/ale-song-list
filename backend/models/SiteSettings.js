const db = require('../config/database');

class SiteSettings {
    // 获取站点设置
    static getSiteSettings() {
        try {
            const row = db.prepare('SELECT site_title, site_favicon FROM streamers WHERE id = 1').get();
            return Promise.resolve(row || { site_title: '歌单系统', site_favicon: null });
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
                // 创建新记录
                const insertStmt = db.prepare('INSERT INTO streamers (name, site_title, site_favicon) VALUES (?, ?, ?)');
                insertStmt.run('Default', site_title, site_favicon);
            }
            
            return Promise.resolve({ success: true });
        } catch (error) {
            return Promise.reject(error);
        }
    }
}

module.exports = SiteSettings; 