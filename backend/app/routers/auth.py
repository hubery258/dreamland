# app/routers/auth.py

from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from ..database import get_db
from .. import crud, schemas, models

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

# JWT 配置
SECRET_KEY = "dreamland-secret-key-change-me"
ALGORITHM = "HS256"


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User | None:
    """从 JWT Token 解析当前用户，未登录返回 None"""
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
    except JWTError:
        return None

    user = crud.get_user_by_username(db, username)
    return user


def require_user(current_user: models.User | None = Depends(get_current_user)):
    """要求登录，未登录抛出 401"""
    if current_user is None:
        raise HTTPException(status_code=401, detail="请先登录")
    return current_user


@router.post("/register", response_model=schemas.UserRead)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    """注册新用户"""
    existing = crud.get_user_by_username(db, user_data.username)
    if existing:
        raise HTTPException(status_code=400, detail="用户名已存在")

    if len(user_data.username) < 2 or len(user_data.username) > 50:
        raise HTTPException(status_code=400, detail="用户名长度 2-50 字符")

    if len(user_data.password) < 4:
        raise HTTPException(status_code=400, detail="密码至少 4 位")

    return crud.create_user(db, user_data)


@router.post("/login", response_model=schemas.TokenResponse)
def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    """用户登录，返回 JWT Token"""
    user = crud.authenticate_user(db, user_data.username, user_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    token = crud.create_access_token(data={"sub": user.username})
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": user.username
    }


@router.get("/me", response_model=schemas.UserRead)
def get_me(current_user: models.User = Depends(require_user)):
    """获取当前登录用户信息"""
    return current_user
