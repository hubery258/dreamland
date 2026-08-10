from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from .. import gallery_crud, schemas
from ..auth import verify_admin_secret
from ..database import get_db

router = APIRouter(prefix="/gallery", tags=["gallery"])


def bad_request(error: ValueError):
    raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/", response_model=schemas.GalleryRead)
def read_gallery(db: Session = Depends(get_db)):
    return gallery_crud.get_gallery(db)


@router.post("/albums", response_model=schemas.AlbumRead)
def create_album(
    data: schemas.AlbumCreate,
    db: Session = Depends(get_db),
    x_admin_secret: str | None = Header(default=None),
):
    verify_admin_secret(x_admin_secret)
    try:
        return gallery_crud.create_album(db, data)
    except ValueError as error:
        bad_request(error)


@router.put("/albums/{album_id}", response_model=schemas.AlbumRead)
def update_album(
    album_id: int,
    data: schemas.AlbumUpdate,
    db: Session = Depends(get_db),
    x_admin_secret: str | None = Header(default=None),
):
    verify_admin_secret(x_admin_secret)
    album = gallery_crud.get_album(db, album_id)
    if not album:
        raise HTTPException(status_code=404, detail="相册不存在")
    try:
        return gallery_crud.update_album(db, album, data)
    except ValueError as error:
        bad_request(error)


@router.delete("/albums/{album_id}")
def delete_album(
    album_id: int,
    db: Session = Depends(get_db),
    x_admin_secret: str | None = Header(default=None),
):
    verify_admin_secret(x_admin_secret)
    album = gallery_crud.get_album(db, album_id)
    if not album:
        raise HTTPException(status_code=404, detail="相册不存在")
    gallery_crud.delete_album(db, album)
    return {"message": "相册已删除，相片已移至未分类"}


@router.post("/photos", response_model=schemas.PhotoRead)
def create_photo(
    data: schemas.PhotoCreate,
    db: Session = Depends(get_db),
    x_admin_secret: str | None = Header(default=None),
):
    verify_admin_secret(x_admin_secret)
    try:
        return gallery_crud.create_photo(db, data)
    except ValueError as error:
        bad_request(error)


@router.put("/photos/{photo_id}", response_model=schemas.PhotoRead)
def update_photo(
    photo_id: int,
    data: schemas.PhotoUpdate,
    db: Session = Depends(get_db),
    x_admin_secret: str | None = Header(default=None),
):
    verify_admin_secret(x_admin_secret)
    photo = gallery_crud.get_photo(db, photo_id)
    if not photo:
        raise HTTPException(status_code=404, detail="照片不存在")
    try:
        return gallery_crud.update_photo(db, photo, data)
    except ValueError as error:
        bad_request(error)


@router.delete("/photos/{photo_id}")
def delete_photo(
    photo_id: int,
    db: Session = Depends(get_db),
    x_admin_secret: str | None = Header(default=None),
):
    verify_admin_secret(x_admin_secret)
    photo = gallery_crud.get_photo(db, photo_id)
    if not photo:
        raise HTTPException(status_code=404, detail="照片不存在")
    gallery_crud.delete_photo(db, photo)
    return {"message": "照片已删除"}