# ============================================
# 后端 Dockerfile
# 使用 Python 3.11 精简镜像
# ============================================
FROM python:3.11-slim

WORKDIR /app

# 先只复制依赖文件（利用 Docker 层缓存：依赖没变就跳过 pip install）
COPY requirement.txt .

# 使用清华源加速 pip 下载（国内服务器必备）
RUN pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple && \
    pip install --no-cache-dir -r requirement.txt

# 再复制应用代码
COPY . .

EXPOSE 8000

# 容器启动命令
# --host 0.0.0.0：允许外部容器（Nginx）访问
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
