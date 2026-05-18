# app/models.py

# 这个文件定义数据库表结构
# 也就是：文章表、标签表、站点信息表

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Table, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from .database import Base

# ----------------------------
# 多对多中间表：文章 <-> 标签
# ----------------------------
post_tags = Table(
    "post_tags",
    Base.metadata,
    Column("post_id", Integer, ForeignKey("posts.id"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True)
)


# ----------------------------
# 文章表
# ----------------------------
class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)

    # 标题
    title = Column(String(255), nullable=False)

    # slug 用在文章 URL，比如 /posts/my-first-post
    slug = Column(String(255), unique=True, index=True, nullable=False)

    # 摘要，可以显示在文章列表页
    summary = Column(Text, nullable=True)

    # Markdown 正文内容
    content = Column(Text, nullable=False)

    # 是否置顶
    is_pinned = Column(Boolean, default=False)

    # 创建和更新时间
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 与 Tag 的多对多关系
    tags = relationship("Tag", secondary=post_tags, back_populates="posts")


# ----------------------------
# 标签表
# ----------------------------
class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)

    # 标签名，例如：阅读 / 随笔 / 写作练习
    name = Column(String(100), unique=True, index=True, nullable=False)

    # 反向关系：一个 tag 可以关联多篇文章
    posts = relationship("Post", secondary=post_tags, back_populates="tags")


# ----------------------------
# 站点信息表
# ----------------------------
class SiteMeta(Base):
    __tablename__ = "site_meta"

    id = Column(Integer, primary_key=True, index=True)

    # About 页的标题
    about_title = Column(String(255), default="About")

    # About 页内容，支持 Markdown
    about_content = Column(Text, default="这里写你的自我介绍。")