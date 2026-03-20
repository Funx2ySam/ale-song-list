# Stage 1: 构建前端
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build:frontend

# Stage 2: 生产镜像
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY backend/ ./backend/
COPY scripts/ ./scripts/
COPY start.js ./
COPY --from=builder /app/frontend/dist ./frontend/dist

RUN mkdir -p frontend/uploads/avatars frontend/uploads/backgrounds frontend/uploads/temp backend/logs backend/data

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "start.js"]
