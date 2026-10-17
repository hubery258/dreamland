from datetime import datetime
from urllib.parse import urlsplit

from pydantic import BaseModel, ConfigDict, Field, field_validator


class FocusItem(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str = Field(max_length=255)
    description: str = Field(max_length=20000)

class NowUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    overview: str = Field(min_length=1, max_length=50000)
    focuses: list[FocusItem] = Field(max_length=10)
    log_description: str = Field(max_length=20000)
    log_url: str = Field(max_length=2048)

    @field_validator("overview")
    @classmethod
    def nonblank_overview(cls, value):
        if not value.strip():
            raise ValueError("近况概述不能为空")
        return value

    @field_validator("log_url")
    @classmethod
    def safe_log_url(cls, value):
        if not value:
            return value
        try:
            parsed = urlsplit(value)
            port = parsed.port
            del port
            valid = (parsed.scheme in {"http", "https"} and parsed.hostname
                     and not parsed.username and not parsed.password
                     and not any(char.isspace() or ord(char) < 32 for char in value)
                     and "\\" not in value)
        except ValueError:
            valid = False
        if not valid:
            raise ValueError("Log 链接须为完整的 http:// 或 https:// 地址，且不含凭据、空白或反斜杠")
        return value


class NowRead(NowUpdate):
    content_updated_at: datetime


class CutRead(BaseModel):
    title: str
    slug: str
    summary: str | None
    created_at: datetime


class NowPublic(BaseModel):
    content: NowRead | None
    cuts: list[CutRead]
