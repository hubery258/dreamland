# app/main.py

# 这是 FastAPI 应用入口文件

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from .database import engine, Base
from .routers import posts, tags, site

# 读取 backend/.env
load_dotenv()

# 创建数据库表
# 第一次运行时会自动建表
Base.metadata.create_all(bind=engine)

# 创建 FastAPI 实例
app = FastAPI(
    title="Minimal Blog API",
    description="一个 React + FastAPI 的极简博客后端",
    version="1.0.0"
)

# 配置跨域（仅开发模式需要）
# 容器化部署时 Nginx 统一代理前后端，不存在跨域问题
# 设置环境变量 DISABLE_CORS=true 可跳过 CORS 中间件
if os.getenv("DISABLE_CORS", "").lower() != "true":
    cors_origins = os.getenv("CORS_ORIGINS", "http://127.0.0.1:5173,http://localhost:5173")
    allowed_origins = [origin.strip() for origin in cors_origins.split(",") if origin.strip()]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# 注册路由
app.include_router(posts.router)
app.include_router(tags.router)
app.include_router(site.router)


@app.get("/")
def root():
    """
    测试接口，用来确认服务已启动
    """
    return {"message": "Blog API is running"}

@app.get("/admin/check")
def admin_check():
    """
    这是一个可选测试接口：
    用来确认后端是否读到了管理员密钥环境变量。
    正式环境里也可以保留。
    """
    admin_key = os.getenv("ADMIN_SECRET", "")
    return {
        "admin_secret_configured": bool(admin_key)
    }