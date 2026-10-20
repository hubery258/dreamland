from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from ..auth import verify_admin_secret
from ..database import get_db
from ..models import Post, Tag
from ..now_models import NowContent
from ..now_schemas import NowUpdate, NowRead, NowPublic

router = APIRouter(prefix="/site/now", tags=["now"])


def read_content(row):
    if row is None:
        return None
    return NowRead(
        overview=row.overview, focuses=row.focuses,
        log_description=row.log_description, log_url=row.log_url,
        content_updated_at=row.content_updated_at.replace(tzinfo=timezone.utc),
    )


@router.get("", response_model=NowPublic)
def get_now(db: Session = Depends(get_db)):
    # All existing posts are public; the current model has no draft/private flag.
    cuts = (db.query(Post).filter(Post.tags.any(Tag.name == "片段收集"))
            .order_by(Post.created_at.desc(), Post.id.desc()).limit(2).all())
    return {
        "content": read_content(db.get(NowContent, 1)),
        "cuts": [{"title": post.title, "slug": post.slug, "summary": post.summary,
                  "created_at": post.created_at.replace(tzinfo=timezone.utc)} for post in cuts],
    }


@router.put("", response_model=NowRead)
def save_now(data: NowUpdate, db: Session = Depends(get_db),
             x_admin_secret: str | None = Header(default=None)):
    verify_admin_secret(x_admin_secret)
    values = data.model_dump()
    try:
        row = db.get(NowContent, 1)
        changed = row is None or row.overview != data.overview or row.focuses != values["focuses"]
        if row is None:
            row = NowContent(id=1)
            db.add(row)
        for key, value in values.items():
            setattr(row, key, value)
        if changed:
            row.content_updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        db.commit()
        db.refresh(row)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=503, detail="Now 保存失败，请稍后重试；本次修改未保存。")
    return read_content(row)
