# app/routers/tags.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import crud, schemas

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("/", response_model=list[schemas.TagRead])
def list_tags(db: Session = Depends(get_db)):
    """
    获取所有标签
    """
    return crud.get_all_tags(db)


@router.get("/{tag_name}")
def get_posts_under_tag(tag_name: str, db: Session = Depends(get_db)):
    """
    获取某个 tag 下面的文章
    """
    result = crud.get_posts_by_tag(db, tag_name)

    if not result:
        raise HTTPException(status_code=404, detail="标签不存在")

    return {
        "tag": {
            "id": result["tag"].id,
            "name": result["tag"].name
        },
        "posts": [
            {
                "id": post.id,
                "title": post.title,
                "slug": post.slug,
                "summary": post.summary,
                "is_pinned": post.is_pinned,
                "created_at": post.created_at,
                "tags": [{"id": t.id, "name": t.name} for t in post.tags]
            }
            for post in result["posts"]
        ]
    }