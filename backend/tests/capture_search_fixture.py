"""Export real search-service responses for OFFLINE browser UI checks.

This never starts a server; offline checks are not evidence of live HTTP wiring.
Run from backend: python tests/capture_search_fixture.py OUTPUT.json
"""

import json
from pathlib import Path
import sys

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app import crud, schemas
from app.database import Base
from app.services.search import search_posts
from serve_search_fixture import seed


def main():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    captured = {"paths": {}, "searches": {}}
    with Session(engine) as db:
        seed(db)
        posts = crud.get_posts(db)
        captured["paths"]["/posts/"] = [schemas.PostListItem.model_validate(post).model_dump(mode="json") for post in posts]
        captured["paths"]["/tags/"] = [schemas.TagRead.model_validate(tag).model_dump(mode="json") for tag in crud.get_all_tags(db)]
        for post in posts:
            captured["paths"][f"/posts/{post.slug}"] = schemas.PostRead.model_validate(post).model_dump(mode="json")
            captured["paths"][f"/posts/{post.slug}/neighbors"] = schemas.PostNeighbors.model_validate(crud.get_post_neighbors(db, post)).model_dump(mode="json")
        queries = ["树 旋转", "分页", "树", "找不到的独特关键词", "仅标题词", "重试词", "旋转", "超长 搜索", "needle", "<img", "安全", "C++ a.b % _"]
        for query in queries:
            for page in (["1", "2", "3", "999", "bad", ""] if query == "分页" else ["1"]):
                key = json.dumps([query, page], ensure_ascii=False, separators=(",", ":"))
                captured["searches"][key] = search_posts(db, query, page).model_dump(mode="json")
    captured["paths"]["/site/about"] = {"id": 1, "about_title": "About", "about_content": ""}
    captured["paths"]["/site/now"] = {"content": None, "cuts": []}
    Path(sys.argv[1]).write_text(json.dumps(captured, ensure_ascii=False), encoding="utf-8")
    engine.dispose()
    print("Exported isolated backend response fixtures. This is not a live browser/backend test.")


if __name__ == "__main__":
    main()
