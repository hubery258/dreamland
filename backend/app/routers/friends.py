from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from .. import friends_crud, schemas
from ..auth import verify_admin_secret
from ..database import get_db

router = APIRouter(prefix="/friends", tags=["friends"])


def bad_request(error: ValueError):
    raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/", response_model=list[schemas.FriendLinkRead])
def read_friends(db: Session = Depends(get_db)):
    return friends_crud.get_friends(db)


@router.post("/", response_model=schemas.FriendLinkRead)
def create_friend(
    data: schemas.FriendLinkCreate,
    db: Session = Depends(get_db),
    x_admin_secret: str | None = Header(default=None),
):
    verify_admin_secret(x_admin_secret)
    try:
        return friends_crud.create_friend(db, data)
    except ValueError as error:
        bad_request(error)


@router.put("/{friend_id}", response_model=schemas.FriendLinkRead)
def update_friend(
    friend_id: int,
    data: schemas.FriendLinkUpdate,
    db: Session = Depends(get_db),
    x_admin_secret: str | None = Header(default=None),
):
    verify_admin_secret(x_admin_secret)
    friend = friends_crud.get_friend(db, friend_id)
    if not friend:
        raise HTTPException(status_code=404, detail="友链不存在")
    try:
        return friends_crud.update_friend(db, friend, data)
    except ValueError as error:
        bad_request(error)


@router.delete("/{friend_id}")
def delete_friend(
    friend_id: int,
    db: Session = Depends(get_db),
    x_admin_secret: str | None = Header(default=None),
):
    verify_admin_secret(x_admin_secret)
    friend = friends_crud.get_friend(db, friend_id)
    if not friend:
        raise HTTPException(status_code=404, detail="友链不存在")
    friends_crud.delete_friend(db, friend)
    return {"message": "友链已删除"}
