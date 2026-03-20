# 歌单管理系统

一个现代化的主播歌单管理系统，深色简约卡片风设计，支持亮/暗主题自适应切换，歌曲管理、标签分类、Excel 导入、图片 OCR 识别等功能。

## 功能特色

### 歌单展示（前台）
- 深色简约卡片风界面，悬停动效
- 亮色/暗色/跟随系统三种主题模式，实时切换
- 歌曲搜索（防抖 + 缓存加速）、标签筛选、分页浏览
- 点击歌曲一键复制到剪贴板
- 自定义头像和背景图
- 响应式布局，适配移动端

### 后台管理
- 密钥登录，JWT 认证，24 小时有效期
- 歌曲 CRUD、批量 Excel 导入、图片 OCR 识别导入
- 标签管理（增删改 + 使用统计）
- 用户设置（头像/背景图上传）
- 站点设置（标题/图标自定义、预览效果）
- 安全设置（修改管理密钥）

## 技术栈

### 前端
- **Vue 3** + **Vite** — SFC 组件化、路由懒加载、HMR 开发体验
- **vue-router 4** — SPA 路由（歌单页 + 管理后台子路由）
- **Naive UI** — 组件库，npm 安装按需打包
- 主题系统：深色/浅色/自动，CSS 变量 + `html.dark` 切换

### 后端
- **Node.js + Express**
- **Better-SQLite3** — 轻量嵌入式数据库
- **JWT** — 身份认证
- **阿里云 OCR SDK** — 图片文字识别（可选）

## 快速开始

### 本地开发

```bash
git clone https://github.com/Funx2ySam/ale-song-list.git
cd ale-song-list
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env，至少设置 ADMIN_SECRET_KEY 和 JWT_SECRET

# 构建前端
npm run build:frontend

# 启动服务
npm start
```

访问 http://localhost:3000，管理后台 http://localhost:3000/admin

### 前端开发模式（HMR 热更新）

```bash
# 终端 1：启动后端
npm run dev

# 终端 2：启动前端开发服务器（自动代理 API 到 localhost:3000）
npm run dev:frontend
```

前端开发服务器运行在 http://localhost:5173

### Docker 部署

```bash
docker-compose -f docker-compose-build.yml up -d
```

或使用预构建镜像：

```bash
docker-compose up -d
```

## 环境变量

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `ADMIN_SECRET_KEY` | 是 | — | 管理后台登录密钥 |
| `JWT_SECRET` | 是 | 随机生成 | JWT 签名密钥 |
| `NODE_ENV` | 否 | development | 运行环境 |
| `PORT` | 否 | 3000 | 服务端口 |
| `CORS_ORIGIN` | 否 | — | CORS 允许来源（逗号分隔） |
| `SITE_TITLE` | 否 | 歌单系统 | 站点标题 |
| `ALIYUN_ACCESS_KEY_ID` | 否 | — | 阿里云 OCR（可选） |
| `ALIYUN_ACCESS_KEY_SECRET` | 否 | — | 阿里云 OCR（可选） |

完整配置参见 `.env.example`。

## 项目结构

```
├── backend/                 # 后端 (Express + SQLite)
│   ├── app.js               # 入口，静态文件托管 frontend/dist
│   ├── config/              # 配置、数据库连接
│   ├── middleware/           # 认证、限流、校验
│   ├── models/              # 数据模型
│   ├── routes/              # API 路由
│   └── utils/               # 缓存、日志、OCR
├── frontend/                # 前端 (Vue 3 + Vite)
│   ├── vite.config.js       # Vite 配置
│   ├── index.html           # Vite 入口 HTML
│   ├── src/
│   │   ├── main.js          # 应用入口
│   │   ├── App.vue          # 根组件（主题 Provider）
│   │   ├── theme.js         # 主题系统（暗色/亮色/自动）
│   │   ├── router/          # vue-router 路由定义
│   │   ├── api/             # 统一 API 封装
│   │   ├── composables/     # 可复用逻辑（认证、站点设置）
│   │   ├── components/      # 通用组件
│   │   └── views/           # 页面组件
│   ├── dist/                # 构建产物（git ignored）
│   └── uploads/             # 上传文件目录
├── scripts/                 # 数据库初始化/校验脚本
├── Dockerfile               # 多阶段构建
├── docker-compose.yml       # Docker Compose
└── .env.example             # 环境变量模板
```

## npm 脚本

| 命令 | 说明 |
|------|------|
| `npm start` | 启动服务（含数据库自动初始化） |
| `npm run dev` | 后端开发模式（nodemon） |
| `npm run dev:frontend` | 前端开发模式（Vite HMR） |
| `npm run build:frontend` | 构建前端到 frontend/dist |
| `npm run build` | 同 build:frontend |
| `npm run init-db` | 手动初始化数据库 |
| `npm run verify` | 校验数据库完整性 |

## API 接口

### 公开接口
- `GET /api/songs` — 歌曲列表（分页、搜索、标签筛选）
- `GET /api/songs/:id` — 歌曲详情
- `GET /api/tags` — 标签列表
- `GET /api/tags/details` — 标签详情（含使用统计）
- `GET /api/streamer/profile` — 用户信息
- `GET /api/site/settings` — 站点设置
- `POST /api/auth/login` — 管理员登录

### 管理接口（需 Bearer Token）
- `POST/PUT/DELETE /api/songs/:id` — 歌曲 CRUD
- `POST/PUT/DELETE /api/tags/:id` — 标签 CRUD
- `PUT /api/streamer/profile` — 更新用户信息
- `POST /api/streamer/avatar` — 上传头像
- `POST /api/streamer/background` — 上传背景图
- `PUT /api/site/settings` — 更新站点设置
- `POST /api/site/favicon` — 上传站点图标
- `PUT /api/auth/change-key` — 修改管理密钥
- `POST /api/songs/import/excel` — Excel 批量导入
- `POST /api/songs/import/image` — 图片 OCR 识别
- `POST /api/songs/import/image/confirm` — 确认导入 OCR 结果

## 许可证

MIT
