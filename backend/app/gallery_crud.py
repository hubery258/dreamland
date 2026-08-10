from datetime import timezone

from sqlalchemy.orm import Session
from slugify import slugify

from . import models, schemas


def _validate_image_url(url: str, field_name: str = "图片 URL"):
    value = url.strip()
    if not value.startswith(("http://", "https://")):
        raise ValueError(f"{field_name} 必须以 http:// 或 https:// 开头")
    return value


def _utc_naive(value):
    """SQLite 不保存时区；统一转成 UTC naive 后写入。"""
    if value.tzinfo is None:
        return value
    return value.astimezone(timezone.utc).replace(tzinfo=None)


def _unique_album_slug(db: Session, title: str):
    base = slugify(title, allow_unicode=True) or "album"
    slug = base
    counter = 1
    while db.query(models.Album).filter(models.Album.slug == slug).first():
        slug = f"{base}-{counter}"
        counter += 1
    return slug


def get_gallery(db: Session):
    return {
        "albums": db.query(models.Album).order_by(models.Album.created_at.asc()).all(),
        "photos": db.query(models.Photo).order_by(
            models.Photo.submitted_at.desc(),
            models.Photo.id.desc(),
        ).all(),
    }


def get_album(db: Session, album_id: int):
    return db.query(models.Album).filter(models.Album.id == album_id).first()


def create_album(db: Session, data: schemas.AlbumCreate):
    title = data.title.strip()
    if not title:
        raise ValueError("相册名称不能为空")
    album = models.Album(
        title=title,
        slug=_unique_album_slug(db, title),
        description=data.description.strip(),
    )
    db.add(album)
    db.commit()
    db.refresh(album)
    return album


def update_album(db: Session, album: models.Album, data: schemas.AlbumUpdate):
    updates = data.model_dump(exclude_unset=True)
    if "title" in updates:
        title = updates["title"].strip()
        if not title:
            raise ValueError("相册名称不能为空")
        album.title = title
    if "description" in updates:
        album.description = updates["description"].strip()
    db.commit()
    db.refresh(album)
    return album


def delete_album(db: Session, album: models.Album):
    db.query(models.Photo).filter(models.Photo.album_id == album.id).update(
        {models.Photo.album_id: None},
        synchronize_session=False,
    )
    db.delete(album)
    db.commit()


def _ensure_album(db: Session, album_id: int | None):
    if album_id is None:
        return
    if not get_album(db, album_id):
        raise ValueError("所选相册不存在")


def create_photo(db: Session, data: schemas.PhotoCreate):
    _ensure_album(db, data.album_id)
    photo = models.Photo(
        album_id=data.album_id,
        image_url=_validate_image_url(data.image_url),
        thumbnail_url=(
            _validate_image_url(data.thumbnail_url, "缩略图 URL")
            if data.thumbnail_url.strip()
            else ""
        ),
        note=data.note.strip(),
        alt=data.alt.strip(),
        submitted_at=_utc_naive(data.submitted_at),
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return photo


def get_photo(db: Session, photo_id: int):
    return db.query(models.Photo).filter(models.Photo.id == photo_id).first()


def update_photo(db: Session, photo: models.Photo, data: schemas.PhotoUpdate):
    updates = data.model_dump(exclude_unset=True)
    if "album_id" in updates:
        _ensure_album(db, updates["album_id"])
        photo.album_id = updates["album_id"]
    if "image_url" in updates and updates["image_url"] is not None:
        photo.image_url = _validate_image_url(updates["image_url"])
    if "thumbnail_url" in updates and updates["thumbnail_url"] is not None:
        raw_thumbnail = updates["thumbnail_url"].strip()
        photo.thumbnail_url = (
            _validate_image_url(raw_thumbnail, "缩略图 URL")
            if raw_thumbnail
            else ""
        )
    for field in ("note", "alt", "submitted_at"):
        if field in updates and updates[field] is not None:
            value = updates[field]
            if field == "submitted_at":
                value = _utc_naive(value)
            setattr(photo, field, value.strip() if isinstance(value, str) else value)
    db.commit()
    db.refresh(photo)
    return photo


def delete_photo(db: Session, photo: models.Photo):
    db.delete(photo)
    db.commit()