# app/database.py

# 这个文件专门负责：
# 1. 创建数据库连接
# 2. 创建 SQLAlchemy 的 Session
# 3. 提供给其他文件使用的 Base

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# SQLite 数据库地址
# 这里会在 backend 目录下生成一个 blog.db 文件
DATABASE_URL = "sqlite:///./blog.db"

# connect_args={"check_same_thread": False} 是 SQLite 常见配置
# 因为 FastAPI 运行时可能会有多线程访问
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# SessionLocal 是后面每次操作数据库时创建“会话”的工厂
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base 是所有 ORM 数据表模型继承的基类
Base = declarative_base()


# 这个函数会被 FastAPI 路由依赖注入使用
# 每次请求到来时：
# 1. 创建一个数据库 session
# 2. 请求结束时自动关闭
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()