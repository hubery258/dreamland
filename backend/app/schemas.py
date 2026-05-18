# app/schemas.py

# 这个文件定义 API 请求体和响应体的数据格式
# 你可以把它理解成：
# “前后端传数据时，数据应该长什么样”

from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


# ----------------------------
# Tag 相关
# ----------------------------
class TagBase(BaseModel):
    name: str


class TagRead(TagBase):
    id: int

    class Config:
        from_attributes = True


# ----------------------------
# Post 相关
# ----------------------------
class PostCreate(BaseModel):
    # 发帖时需要传这些字段
    title: str
    summary: Optional[str] = ""
    content: str
    is_pinned: bool = False

    # 这里 tags 直接传字符串数组
    # 例如：["阅读", "随笔"]
    tags: List[str] = []


class PostUpdate(BaseModel):
    # 更新文章时允许部分字段可选
    title: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    is_pinned: Optional[bool] = None
    tags: Optional[List[str]] = None


class PostRead(BaseModel):
    id: int
    title: str
    slug: str
    summary: Optional[str]
    content: str
    is_pinned: bool
    created_at: datetime
    updated_at: datetime
    tags: List[TagRead] = []

    class Config:
        from_attributes = True


class PostListItem(BaseModel):
    # 列表页不一定要返回全文，可以单独做一个精简结构
    id: int
    title: str
    slug: str
    summary: Optional[str]
    is_pinned: bool
    created_at: datetime
    tags: List[TagRead] = []

    class Config:
        from_attributes = True


# ----------------------------
# About / SiteMeta 相关
# ----------------------------
class SiteMetaRead(BaseModel):
    id: int
    about_title: str
    about_content: str

    class Config:
        from_attributes = True


class SiteMetaUpdate(BaseModel):
    about_title: Optional[str] = None
    about_content: Optional[str] = None