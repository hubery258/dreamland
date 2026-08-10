# app/routers/posts.py

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..auth import verify_admin_secret
from ..database import get_db

router = APIRouter(prefix="/posts", tags=["posts"])


@router.get("/", response_model=list[schemas.PostListItem])
def list_posts(db: Session = Depends(get_db)):
    """获取文章列表。"""
    return crud.get_posts(db)


@router.post("/", response_model=schemas.PostRead)
def create_new_post(
    post: schemas.PostCreate,
    db: Session = Depends(get_db),
    x_admin_secret: str | None = Header(default=None)
):
    """创建新文章。"""
    verify_admin_secret(x_admin_secret)
    return crud.create_post(db, post)


@router.get("/{slug}", response_model=schemas.PostRead)
def get_single_post(slug: str, db: Session = Depends(get_db)):
    """获取单篇文章详情。"""
    db_post = crud.get_post_by_slug(db, slug)
    if not db_post:
        raise HTTPException(status_code=404, detail="文章不存在")
    return db_post


@router.get("/{slug}/neighbors", response_model=schemas.PostNeighbors)
def get_single_post_neighbors(slug: str, db: Session = Depends(get_db)):
    """获取发布时间上紧邻当前文章的较旧、较新文章。"""
    db_post = crud.get_post_by_slug(db, slug)
    if not db_post:
        raise HTTPException(status_code=404, detail="文章不存在")
    return crud.get_post_neighbors(db, db_post)


@router.put("/{slug}", response_model=schemas.PostRead)
def update_single_post(
    slug: str,
    post: schemas.PostUpdate,
    db: Session = Depends(get_db),
    x_admin_secret: str | None = Header(default=None)
):
    """更新文章。"""
    verify_admin_secret(x_admin_secret)
    db_post = crud.update_post(db, slug, post)
    if not db_post:
        raise HTTPException(status_code=404, detail="文章不存在")
    return db_post


@router.delete("/{slug}")
def delete_single_post(
    slug: str,
    db: Session = Depends(get_db),
    x_admin_secret: str | None = Header(default=None)
):
    """删除文章。"""
    verify_admin_secret(x_admin_secret)
    success = crud.delete_post(db, slug)
    if not success:
        raise HTTPException(status_code=404, detail="文章不存在")
    return {"message": "文章已删除"}