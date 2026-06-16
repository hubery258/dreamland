# ============================================
# 前端 Dockerfile（多阶段构建）
# 阶段 1：Node.js 构建 React → dist/
# 阶段 2：Nginx 托管静态文件 + 反向代理后端
# 最终镜像只含 Nginx + 静态文件，约 25MB
# ============================================

# ---------- 阶段 1：构建 ----------
FROM node:20-alpine AS builder

WORKDIR /app

# 利用缓存：先复制依赖描述文件
COPY package*.json .
RUN npm install

# 再复制源码并构建
COPY . .
RUN npm run build

# ---------- 阶段 2：运行 ----------
FROM nginx:alpine

# 从阶段 1 拷贝构建好的静态文件
COPY --from=builder /app/dist /usr/share/nginx/html

# 替换 Nginx 默认配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
