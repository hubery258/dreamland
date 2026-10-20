"""Posts-only search responses. All highlighted content remains plain text."""

from datetime import datetime

from pydantic import BaseModel

from .schemas import TagRead


class TextPart(BaseModel):
    text: str
    highlight: bool = False


class SearchSnippet(BaseModel):
    parts: list[TextPart]
    leading_ellipsis: bool
    trailing_ellipsis: bool


class SearchPost(BaseModel):
    id: int
    slug: str
    created_at: datetime
    tags: list[TagRead]
    title: list[TextPart]
    snippets: list[SearchSnippet]


class SearchResults(BaseModel):
    query: str
    keywords: list[str]
    total: int
    page: int
    page_size: int = 10
    total_pages: int
    items: list[SearchPost]
