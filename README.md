# 主播歌单管理系统

一个现代化的主播歌单管理系统，支持歌曲管理、标签分类、Excel导入等功能。

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
- **主播设置**：头像、背景图片、个人信息管理
- **数据统计**：歌曲数量、标签统计等
- **Excel导入**：批量导入歌曲数据（准备中）

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm 或 yarn

### 方式一：本地安装

1. **克隆项目**
```bash
git clone <repository-url>
cd ale-song-list
```

2. **安装依赖**
```bash
npm install
```

3. **启动项目**
```bash
npm start
```

### 方式二：Docker部署（推荐）

1. **克隆项目**
```bash
git clone <repository-url>
cd ale-song-list
```

2. **使用Docker Compose启动**
```bash
# 构建并启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

3. **访问系统**
- 歌单页面：http://localhost:3000
- 管理后台：http://localhost:3000/admin

### Docker部署优势
- ✅ 环境一致性，无需担心Node.js版本问题
- ✅ 自动数据持久化，重启容器数据不丢失
- ✅ 生产环境就绪，可直接部署到服务器
- ✅ 资源隔离，不影响宿主机环境

### Docker自定义配置

修改 `docker-compose.yml` 中的环境变量：
```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
  - ADMIN_SECRET_KEY=your_custom_admin_key  # 修改管理密钥
  - MAX_FILE_SIZE=20971520  # 修改文件上传限制（20MB）
```

### 普通安装（继续使用原流程）

系统会自动：
- 检查并初始化数据库
- 插入示例数据
- 启动服务器

4. **访问系统**
- 歌单页面：http://localhost:3001
- 管理后台：http://localhost:3001/admin

### 开发模式

```bash
npm run dev  # 使用 nodemon 自动重启
```

## 🔧 配置说明

### 环境变量
创建 `.env` 文件：

```env
# 服务端口
PORT=3001

# 管理密钥
ADMIN_KEY=your-admin-key

# JWT密钥
JWT_SECRET=your-jwt-secret

# 数据库路径
DB_PATH=./backend/data/database.sqlite

# 上传文件大小限制（字节）
MAX_FILE_SIZE=10485760

# 开发模式
NODE_ENV=development
```

### 默认配置
- **端口**：3001
- **管理密钥**：admin123
- **文件上传限制**：10MB
- **Token有效期**：24小时

## 📁 项目结构

```
ale-song-list/
├── backend/                # 后端代码
│   ├── app.js             # 应用入口
│   ├── config/            # 配置文件
│   ├── middleware/        # 中间件
│   ├── models/            # 数据模型
│   ├── routes/            # 路由
│   └── utils/             # 工具函数
├── frontend/              # 前端代码
│   ├── index.html         # 主页面
│   ├── admin.html         # 管理页面
│   └── uploads/           # 上传文件
├── scripts/               # 脚本文件
│   ├── init-db.js         # 数据库初始化
│   └── seed-data.js       # 种子数据
├── start.js               # 启动脚本
└── package.json           # 项目配置
```

## 🎯 使用指南

### 访问歌单页面
1. 打开浏览器访问 http://localhost:3001
2. 浏览歌曲列表
3. 使用搜索框查找歌曲
4. 点击标签筛选歌曲
5. 点击歌曲卡片复制歌曲信息

### 管理后台操作

#### 登录管理后台
1. 在歌单页面点击右下角设置按钮
2. 输入管理密钥（默认：admin123）
3. 登录成功后自动跳转到管理后台

#### 歌曲管理
- **添加歌曲**：点击"添加歌曲"按钮，填写信息
- **编辑歌曲**：在歌曲列表中点击"编辑"
- **删除歌曲**：点击"删除"或使用批量删除
- **搜索歌曲**：使用搜索框快速查找

#### 标签管理
- **添加标签**：输入标签名称后点击"添加标签"
- **删除标签**：点击标签右侧的 × 号

#### 主播设置
- **基本信息**：修改名称和简介
- **头像上传**：支持拖拽上传图片
- **背景设置**：设置页面背景图

## 🔌 API 接口

### 公开接口（无需身份验证）
- `GET /api/health` - 健康检查
- `GET /api/songs` - 获取歌曲列表
- `GET /api/tags` - 获取标签列表
- `GET /api/streamer/profile` - 获取主播信息
- `POST /api/auth/login` - 管理员登录

### 管理接口（需要身份验证）
- `POST /api/songs` - 添加歌曲
- `PUT /api/songs/:id` - 更新歌曲
- `DELETE /api/songs/:id` - 删除歌曲
- `POST /api/tags` - 添加标签
- `DELETE /api/tags/:name` - 删除标签
- `PUT /api/streamer/profile` - 更新主播信息
- `POST /api/streamer/avatar` - 上传头像
- `POST /api/streamer/background` - 上传背景

## 🛠️ 技术栈

### 前端
- **Vue 3** - 响应式框架
- **Naive UI** - 现代化组件库
- **原生JavaScript** - 无构建工具，开箱即用

### 后端
- **Node.js + Express** - 服务器框架
- **Better-SQLite3** - 轻量级数据库
- **JWT** - 身份认证
- **Multer** - 文件上传

### 开发工具
- **Nodemon** - 开发时自动重启
- **dotenv** - 环境变量管理

## 📝 开发说明

### 数据库操作
```bash
# 重新初始化数据库
npm run init-db

# 清理数据库和上传文件
npm run clean
```

### 端口冲突解决
如果默认端口被占用，可以指定其他端口：
```bash
PORT=8080 npm start
```

### 日志查看
日志文件位置：`backend/logs/`

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🆘 常见问题

### Q: 端口被占用怎么办？
A: 使用 `PORT=其他端口 npm start` 指定其他端口

### Q: 数据库文件在哪里？
A: 位于 `backend/data/database.sqlite`

### Q: 如何重置管理密钥？
A: 修改 `.env` 文件中的 `ADMIN_KEY` 或环境变量

### Q: 上传的文件存储在哪里？
A: 存储在 `frontend/uploads/` 目录下

### Q: 如何备份数据？
A: 复制整个 `backend/data/` 目录即可

## 📞 支持

如有问题或建议，请：
- 提交 Issue
- 发送邮件到 [your-email@example.com]
- 加入讨论群：[群号]

---

**享受使用主播歌单管理系统！** 🎵✨
