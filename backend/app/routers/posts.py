# app/routers/posts.py

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
import os

from ..database import get_db
from .. import crud, schemas, models
from .auth import get_current_user, require_user

router = APIRouter(prefix="/posts", tags=["posts"])


@router.get("/", response_model=list[schemas.PostListItem])
def list_posts(db: Session = Depends(get_db)):
    """
    获取文章列表
    """
    return crud.get_posts(db)


@router.post("/", response_model=schemas.PostRead)
def create_new_post(
    post: schemas.PostCreate,
    db: Session = Depends(get_db),
    x_admin_secret: str | None = Header(default=None)
):
    """
    创建新文章

    这里增加一个简单管理员保护：
    前端必须在请求头里带上 X-Admin-Secret
    并且值要和后端环境变量 ADMIN_SECRET 一致
    """
    admin_secret = os.getenv("ADMIN_SECRET", "")

    print("DEBUG x_admin_secret from frontend:", repr(x_admin_secret))
    print("DEBUG ADMIN_SECRET from backend:", repr(admin_secret))

    # 如果后端根本没配置 ADMIN_SECRET，就不给发帖
    if not admin_secret:
        raise HTTPException(
            status_code=500,
            detail="服务器未配置管理员密钥 ADMIN_SECRET"
        )

    # 前端没传，或者传错，都拒绝
    if x_admin_secret != admin_secret:
        raise HTTPException(
            status_code=401,
            detail="管理员密钥错误，无法发布文章"
        )

    return crud.create_post(db, post)


@router.get("/{slug}", response_model=schemas.PostRead)
def get_single_post(
    slug: str,
    db: Session = Depends(get_db),
    current_user: models.User | None = Depends(get_current_user)
):
    """
    获取单篇文章详情（含点赞/收藏状态）
    """
    db_post = crud.get_post_by_slug(db, slug)
    if not db_post:
        raise HTTPException(status_code=404, detail="文章不存在")

    # 注入点赞/收藏状态
    user_id = current_user.id if current_user else None
    liked, like_count = crud.get_like_status(db, user_id, db_post.id)
    favorited, favorite_count = crud.get_favorite_status(db, user_id, db_post.id)

    result = schemas.PostRead.model_validate(db_post)
    result.liked = liked
    result.like_count = like_count
    result.favorited = favorited
    result.favorite_count = favorite_count
    return result


# ----------------------------
# 点赞
# ----------------------------
@router.post("/{slug}/like", response_model=schemas.LikeStatus)
def like_post(
    slug: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_user)
):
    """点赞 / 取消点赞"""
    result = crud.toggle_like(db, current_user, slug)
    if result is None:
        raise HTTPException(status_code=404, detail="文章不存在")
    return result


# ----------------------------
# 收藏
# ----------------------------
@router.post("/{slug}/favorite", response_model=schemas.FavoriteStatus)
def favorite_post(
    slug: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_user)
):
    """收藏 / 取消收藏"""
    result = crud.toggle_favorite(db, current_user, slug)
    if result is None:
        raise HTTPException(status_code=404, detail="文章不存在")
    return result


@router.put("/{slug}", response_model=schemas.PostRead)
def update_single_post(slug: str, post: schemas.PostUpdate, db: Session = Depends(get_db)):
    """
    更新文章
    """
    db_post = crud.update_post(db, slug, post)
    if not db_post:
        raise HTTPException(status_code=404, detail="文章不存在")
    return db_post


@router.delete("/{slug}")
def delete_single_post(slug: str, db: Session = Depends(get_db)):
    """
    删除文章
    """
    success = crud.delete_post(db, slug)
    if not success:
        raise HTTPException(status_code=404, detail="文章不存在")

    return {"message": "文章已删除"}