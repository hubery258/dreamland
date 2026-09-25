# app/database.py

# 这个文件专门负责：
# 1. 创建数据库连接
# 2. 创建 SQLAlchemy 的 Session
# 3. 提供给其他文件使用的 Base

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# SQLite 数据库地址。生产和测试都可以通过环境变量覆盖，默认仍然是
# backend 目录下的 blog.db，保持现有本地写作流程不变。
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./blog.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
