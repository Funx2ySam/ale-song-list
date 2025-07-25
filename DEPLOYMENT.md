# 部署指南

## 🐳 Docker 部署（推荐）

### 快速启动

```bash
# 克隆项目
git clone <repository-url>
cd ale-song-list

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 环境配置

修改 `docker-compose.yml` 中的环境变量：

```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
  - ADMIN_SECRET_KEY=your_secure_admin_key_here  # 必须修改
  - MAX_FILE_SIZE=10485760  # 10MB
```

### 数据持久化

Docker配置已自动处理数据持久化：
- 数据库文件：`./backend/data` → `/app/backend/data`
- 上传文件：`./frontend/uploads` → `/app/frontend/uploads`
- 日志文件：`./backend/logs` → `/app/backend/logs`

## 🖥️ 传统部署

### 1. 环境准备

```bash
# 安装 Node.js 16+
node --version  # >= 16.0.0
npm --version

# 安装 PM2（可选，用于生产环境）
npm install -g pm2
```

### 2. 项目部署

```bash
# 克隆项目
git clone <repository-url>
cd ale-song-list

# 安装依赖
npm install

# 初始化数据库
npm run init-db

# 启动服务
npm start
# 或使用 PM2
pm2 start start.js --name "ale-song-list"
```

### 3. Nginx 配置（可选）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态文件缓存
    location /uploads/ {
        proxy_pass http://localhost:3000;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

## 🔒 安全配置

### 必须修改的配置

1. **管理密钥**
   ```bash
   # Docker
   vim docker-compose.yml
   # 修改 ADMIN_SECRET_KEY

   # 传统部署
   echo "ADMIN_SECRET_KEY=your_secure_key" > .env
   ```

2. **文件权限**
   ```bash
   # 确保上传目录权限正确
   chmod 755 frontend/uploads
   chmod 755 frontend/uploads/avatars
   chmod 755 frontend/uploads/backgrounds
   ```

3. **防火墙设置**
   ```bash
   # 只开放必要端口
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw allow 22/tcp  # SSH
   ufw enable
   ```

## 📊 监控和维护

### 日志查看

```bash
# Docker
docker-compose logs -f ale-song-list

# 传统部署
tail -f backend/logs/$(date +%Y-%m-%d).log

# PM2
pm2 logs ale-song-list
```

### 数据备份

```bash
# 备份数据库
cp backend/data/database.sqlite backup/database_$(date +%Y%m%d).sqlite

# 备份上传文件
tar -czf backup/uploads_$(date +%Y%m%d).tar.gz frontend/uploads/

# Docker环境备份
docker-compose exec ale-song-list tar -czf /tmp/backup.tar.gz backend/data frontend/uploads
docker cp ale-song-list:/tmp/backup.tar.gz ./backup_$(date +%Y%m%d).tar.gz
```

### 更新部署

```bash
# Docker更新
git pull
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 传统部署更新
git pull
npm install
pm2 restart ale-song-list
```

## 🚨 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 查看端口占用
   netstat -tlnp | grep :3000
   # 或
   lsof -i :3000
   ```

2. **数据库权限问题**
   ```bash
   # 修复数据库文件权限
   chmod 664 backend/data/database.sqlite
   chown www-data:www-data backend/data/database.sqlite
   ```

3. **上传文件失败**
   ```bash
   # 检查目录权限
   ls -la frontend/uploads/
   # 修复权限
   chmod 755 frontend/uploads/avatars frontend/uploads/backgrounds
   ```

4. **Docker容器无法启动**
   ```bash
   # 查看详细错误
   docker-compose logs ale-song-list
   # 重新构建
   docker-compose build --no-cache
   ```

## 📈 性能优化

### 生产环境配置

1. **启用压缩** - Nginx gzip
2. **静态文件缓存** - 设置合适的缓存头
3. **数据库优化** - 定期清理日志
4. **监控设置** - 使用 PM2 监控进程状态

### 资源限制

```yaml
# docker-compose.yml 中添加资源限制
services:
  ale-song-list:
    # ...
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
``` 