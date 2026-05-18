# app/routers/site.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from .. import crud, schemas

router = APIRouter(prefix="/site", tags=["site"])


@router.get("/about", response_model=schemas.SiteMetaRead)
def get_about_info(db: Session = Depends(get_db)):
    """
    获取 About 页面内容
    """
    return crud.get_site_meta(db)


@router.put("/about", response_model=schemas.SiteMetaRead)
def update_about_info(meta_data: schemas.SiteMetaUpdate, db: Session = Depends(get_db)):
    """
    更新 About 页面内容
    因为你现在不要登录，所以这个接口先直接开放。
    后面如果要加后台登录，可以再保护这个接口。
    """
    return crud.update_site_meta(db, meta_data)