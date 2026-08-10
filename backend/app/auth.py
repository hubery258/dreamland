import os

from fastapi import HTTPException


def verify_admin_secret(x_admin_secret: str | None):
    """校验所有管理写操作使用的管理员密钥。"""
    admin_secret = os.getenv("ADMIN_SECRET", "")
    if not admin_secret:
        raise HTTPException(
            status_code=500,
            detail="服务器未配置管理员密钥 ADMIN_SECRET",
        )
    if x_admin_secret != admin_secret:
        raise HTTPException(status_code=401, detail="管理员密钥错误")