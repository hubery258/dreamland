# app/crud.py

# 这个文件负责“真正操作数据库”
# 路由层只负责接收请求、返回响应
# 数据库增删改查细节尽量放在这里，结构更清楚

from sqlalchemy.orm import Session
from slugify import slugify

from . import models, schemas


# ----------------------------
# Tag 工具函数
# ----------------------------
def get_or_create_tags(db: Session, tag_names: list[str]):
    """
    根据传入的标签名数组，查找已有标签；
    如果数据库里没有，就自动创建。
    最后返回 Tag 对象列表。
    """
    tag_objects = []

    for raw_name in tag_names:
        name = raw_name.strip()
        if not name:
            continue

        tag = db.query(models.Tag).filter(models.Tag.name == name).first()
        if not tag:
            tag = models.Tag(name=name)
            db.add(tag)
            db.flush()  # flush 后 tag 就会拿到 id

        tag_objects.append(tag)

    return tag_objects


# ----------------------------
# Post 相关
# ----------------------------
def generate_unique_slug(db: Session, title: str):
    """
    根据文章标题生成 slug。
    如果 slug 已存在，就自动在后面加 -1, -2 ...
    """
    base_slug = slugify(title, allow_unicode=True)

    # 如果标题全是特殊字符，有可能 slugify 后为空
    if not base_slug:
        base_slug = "post"

    slug = base_slug
    counter = 1

    while db.query(models.Post).filter(models.Post.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    return slug


def create_post(db: Session, post_data: schemas.PostCreate):
    """
    创建文章
    """
    slug = generate_unique_slug(db, post_data.title)

    tag_objects = get_or_create_tags(db, post_data.tags)

    db_post = models.Post(
        title=post_data.title,
        slug=slug,
        summary=post_data.summary,
        content=post_data.content,
        is_pinned=post_data.is_pinned,
        tags=tag_objects
    )

    db.add(db_post)
    db.commit()
    db.refresh(db_post)

    return db_post


def get_posts(db: Session):
    """
    获取所有文章
    排序规则：
    1. 置顶文章在前
    2. 再按创建时间倒序
    """
    return (
        db.query(models.Post)
        .order_by(models.Post.is_pinned.desc(), models.Post.created_at.desc())
        .all()
    )


def get_post_by_slug(db: Session, slug: str):
    """
    根据 slug 获取单篇文章
    """
    return db.query(models.Post).filter(models.Post.slug == slug).first()


def update_post(db: Session, slug: str, post_data: schemas.PostUpdate):
    """
    更新文章
    """
    db_post = get_post_by_slug(db, slug)
    if not db_post:
        return None

    if post_data.title is not None:
        db_post.title = post_data.title

    if post_data.summary is not None:
        db_post.summary = post_data.summary

    if post_data.content is not None:
        db_post.content = post_data.content

    if post_data.is_pinned is not None:
        db_post.is_pinned = post_data.is_pinned

    if post_data.tags is not None:
        db_post.tags = get_or_create_tags(db, post_data.tags)

    db.commit()
    db.refresh(db_post)

    return db_post


def delete_post(db: Session, slug: str):
    """
    删除文章
    """
    db_post = get_post_by_slug(db, slug)
    if not db_post:
        return False

    db.delete(db_post)
    db.commit()
    return True


# ----------------------------
# Tag 相关
# ----------------------------
def get_all_tags(db: Session):
    """
    获取所有标签
    """
    return db.query(models.Tag).order_by(models.Tag.name.asc()).all()


def get_posts_by_tag(db: Session, tag_name: str):
    """
    获取某个标签下的所有文章
    """
    tag = db.query(models.Tag).filter(models.Tag.name == tag_name).first()
    if not tag:
        return None

    # 这里直接返回这个 tag 关联的文章列表
    # 为了前台显示更稳定，可以再手动排序一下
    posts = sorted(
        tag.posts,
        key=lambda p: (not p.is_pinned, -p.created_at.timestamp())
    )
    return {
        "tag": tag,
        "posts": posts
    }


# ----------------------------
# SiteMeta / About 相关
# ----------------------------
def get_site_meta(db: Session):
    """
    获取站点信息。
    如果数据库里还没有 about 信息，就自动初始化一条。
    """
    meta = db.query(models.SiteMeta).first()

    if not meta:
        meta = models.SiteMeta(
            about_title="About",
            about_content="这里写你的自我介绍。你以后可以从接口里更新。"
        )
        db.add(meta)
        db.commit()
        db.refresh(meta)

    return meta


def update_site_meta(db: Session, meta_data: schemas.SiteMetaUpdate):
    """
    更新站点信息（主要是 about 页面内容）
    """
    meta = get_site_meta(db)

    if meta_data.about_title is not None:
        meta.about_title = meta_data.about_title

    if meta_data.about_content is not None:
        meta.about_content = meta_data.about_content

    db.commit()
    db.refresh(meta)

    return meta


# ----------------------------
# Auth 相关
# ----------------------------
from jose import JWTError, jwt
from datetime import datetime, timedelta
import bcrypt
import os

SECRET_KEY = os.getenv("JWT_SECRET", "dreamland-secret-key-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 小时


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()


def create_user(db: Session, user_data: schemas.UserCreate) -> models.User:
    hashed = hash_password(user_data.password)
    db_user = models.User(username=user_data.username, password_hash=hashed)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, username: str, password: str):
    user = get_user_by_username(db, username)
    if not user or not verify_password(password, user.password_hash):
        return None
    return user


# ----------------------------
# 点赞相关
# ----------------------------
def toggle_like(db: Session, user: models.User, slug: str):
    post = db.query(models.Post).filter(models.Post.slug == slug).first()
    if not post:
        return None

    existing = db.query(models.post_likes).filter(
        models.post_likes.c.user_id == user.id,
        models.post_likes.c.post_id == post.id
    ).first()

    if existing:
        db.execute(
            models.post_likes.delete().where(
                models.post_likes.c.user_id == user.id,
                models.post_likes.c.post_id == post.id
            )
        )
        db.commit()
        liked = False
    else:
        db.execute(
            models.post_likes.insert().values(user_id=user.id, post_id=post.id)
        )
        db.commit()
        liked = True

    like_count = db.query(models.post_likes).filter(
        models.post_likes.c.post_id == post.id
    ).count()

    return {"liked": liked, "like_count": like_count}


def get_like_status(db: Session, user_id: int | None, post_id: int):
    liked = False
    if user_id:
        liked = db.query(models.post_likes).filter(
            models.post_likes.c.user_id == user_id,
            models.post_likes.c.post_id == post_id
        ).first() is not None
    like_count = db.query(models.post_likes).filter(
        models.post_likes.c.post_id == post_id
    ).count()
    return liked, like_count


# ----------------------------
# 收藏相关
# ----------------------------
def toggle_favorite(db: Session, user: models.User, slug: str):
    post = db.query(models.Post).filter(models.Post.slug == slug).first()
    if not post:
        return None

    existing = db.query(models.user_favorites).filter(
        models.user_favorites.c.user_id == user.id,
        models.user_favorites.c.post_id == post.id
    ).first()

    if existing:
        db.execute(
            models.user_favorites.delete().where(
                models.user_favorites.c.user_id == user.id,
                models.user_favorites.c.post_id == post.id
            )
        )
        db.commit()
        favorited = False
    else:
        db.execute(
            models.user_favorites.insert().values(user_id=user.id, post_id=post.id)
        )
        db.commit()
        favorited = True

    favorite_count = db.query(models.user_favorites).filter(
        models.user_favorites.c.post_id == post.id
    ).count()

    return {"favorited": favorited, "favorite_count": favorite_count}


def get_favorite_status(db: Session, user_id: int | None, post_id: int):
    favorited = False
    if user_id:
        favorited = db.query(models.user_favorites).filter(
            models.user_favorites.c.user_id == user_id,
            models.user_favorites.c.post_id == post_id
        ).first() is not None
    favorite_count = db.query(models.user_favorites).filter(
        models.user_favorites.c.post_id == post_id
    ).count()
    return favorited, favorite_count