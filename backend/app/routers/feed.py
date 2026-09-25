"""Public RSS feed endpoint."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from .. import crud
from ..database import get_db
from ..services.feed import FeedConfig, build_feed_bytes, etag_for, if_none_match_matches

logger = logging.getLogger(__name__)
router = APIRouter(tags=["feed"])


@router.api_route("/rss.xml", methods=["GET", "HEAD"], include_in_schema=False)
def rss_feed(request: Request, db: Session = Depends(get_db)) -> Response:
    """Return the public RSS source with deterministic conditional caching."""
    try:
        config = FeedConfig.from_env()
        posts = crud.get_feed_posts(db, config.limit)
        content = build_feed_bytes(posts, config)
    except Exception as exc:
        logger.exception("RSS generation failed")
        raise HTTPException(status_code=500, detail="RSS feed generation failed") from exc

    etag = etag_for(content)
    headers = {
        "Cache-Control": "public, max-age=300",
        "ETag": etag,
        "Content-Type": "application/rss+xml; charset=utf-8",
    }
    if if_none_match_matches(request.headers.get("if-none-match"), etag):
        return Response(status_code=304, headers=headers)
    if request.method == "HEAD":
        return Response(status_code=200, headers=headers)
    return Response(content=content, status_code=200, headers=headers)
