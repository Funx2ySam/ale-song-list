# 歌单管理系统

一个现代化的歌单管理系统，支持歌曲管理、标签分类、Excel导入、图片OCR识别等功能。

## ✨ 功能特色

### 🎵 歌单展示（前台）
- **精美界面**：使用 Naive UI 组件库，界面现代化
- **歌曲搜索**：支持按歌曲名称、歌手搜索
- **标签筛选**：快速按标签过滤歌曲
- **一键复制**：点击歌曲即可复制到剪贴板
- **响应式设计**：完美适配移动端和桌面端

### 🎛️ 后台管理
- **身份验证**：密钥登录，24小时有效期
- **歌曲管理**：增删改查歌曲，批量操作
- **标签管理**：创建、编辑、删除标签
- **用户设置**：头像、背景图片、个人信息管理
- **安全设置**：修改管理员登录密钥
- **数据统计**：歌曲数量、标签统计等
- **Excel导入**：批量导入歌曲数据
- **图片OCR**：支持歌单截图的智能识别和导入

## 🚀 快速部署

### Docker Compose部署（推荐）

1. **下载配置文件**
```bash
curl -O https://raw.githubusercontent.com/Funx2ySam/ale-song-list/main/docker-compose.prod.yml
```

2. **启动服务**
```bash
# 创建数据目录
mkdir -p data uploads logs

# 启动服务
docker-compose -f docker-compose.prod.yml up -d
```

4. **访问系统**
- 歌单页面：http://localhost:3000
- 管理后台：http://localhost:3000/admin
- 默认密钥：admin123

### 本地开发

```bash
git clone https://github.com/Funx2ySam/ale-song-list.git
cd ale-song-list

# 安装依赖（包含阿里云OCR SDK）
npm install

# 配置环境变量（可选，配置后可使用OCR功能）
# cp .env.example .env && 编辑 .env 文件

# 启动服务
npm start
```

## 🔧 配置说明

### 环境变量
可以在 `docker-compose.prod.yml` 中修改，或创建 `.env` 文件：

```yaml
environment:
  - NODE_ENV=production
  - ADMIN_SECRET_KEY=your_custom_key  # 修改管理密钥
  # OCR配置（可选）
  - ALIYUN_ACCESS_KEY_ID=your_access_key_id
  - ALIYUN_ACCESS_KEY_SECRET=your_access_key_secret
  - ALIYUN_OCR_ENDPOINT=ocr-api.cn-hangzhou.aliyuncs.com
```

**注意**：OCR图片识别功能为可选功能，如不需要可忽略相关配置。

### 默认配置
- **端口**：3000
- **管理密钥**：admin123（请及时修改）
- **数据持久化**：自动挂载 data、uploads、logs 目录

## 📡 API接口

### 公开接口
- `GET /api/songs` - 获取歌曲列表
- `GET /api/tags` - 获取标签列表  
- `GET /api/streamer/profile` - 获取用户信息
- `POST /api/auth/login` - 管理员登录

### 管理接口（需要身份验证）
- `POST /api/songs` - 添加歌曲
- `PUT /api/songs/:id` - 更新歌曲
- `DELETE /api/songs/:id` - 删除歌曲
- `POST /api/tags` - 添加标签
- `DELETE /api/tags/:name` - 删除标签
- `PUT /api/streamer/profile` - 更新用户信息
- `POST /api/streamer/avatar` - 上传头像
- `POST /api/streamer/background` - 上传背景
- `PUT /api/auth/change-key` - 修改管理密钥

### 导入接口
- `GET /api/songs/import/template` - 下载Excel模板
- `POST /api/songs/import/excel` - Excel批量导入
- `POST /api/songs/import/image` - 图片OCR识别
- `POST /api/songs/import/image/confirm` - 确认导入OCR识别结果

## 🛠️ 技术栈

### 前端
- **Vue 3** - 响应式框架
- **Naive UI** - 现代化组件库

### 后端
- **Node.js + Express** - 服务器框架
- **Better-SQLite3** - 轻量级数据库
- **JWT** - 身份认证
- **阿里云OCR SDK** - 图片文字识别

## 🆘 常见问题

### Q: 如何修改端口？
A: 修改 `docker-compose.prod.yml` 中的端口映射

### Q: 数据存储在哪里？
A: 数据自动保存在 `data`、`uploads`、`logs` 目录

### Q: 如何备份数据？
A: 备份 `data`、`uploads`、`logs` 三个目录即可

### Q: 如何更新到最新版本？
A: 运行 `docker-compose -f docker-compose.prod.yml pull && docker-compose -f docker-compose.prod.yml up -d`

### Q: 图片识别功能不可用怎么办？
A: 图片识别功能为可选功能，如不需要可以正常使用系统的其他功能

---

**享受使用歌单管理系统！** 🎵✨
