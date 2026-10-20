# app/routers/site.py

from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from ..database import get_db
from .. import crud, schemas
from ..auth import verify_admin_secret

router = APIRouter(prefix="/site", tags=["site"])


@router.get("/about", response_model=schemas.SiteMetaRead)
def get_about_info(db: Session = Depends(get_db)):
    """
    获取 About 页面内容
    """
    return crud.get_site_meta(db)


@router.put("/about", response_model=schemas.SiteMetaRead)
def update_about_info(
    meta_data: schemas.SiteMetaUpdate,
    db: Session = Depends(get_db),
    x_admin_secret: str | None = Header(default=None),
):
    """
    更新 About 页面内容
    使用与其他管理入口一致的管理员密钥校验。
    """
    verify_admin_secret(x_admin_secret)
    return crud.update_site_meta(db, meta_data)
