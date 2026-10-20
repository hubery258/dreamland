"""Launch the actual application against disposable seeded SQLite data.

Run from backend: python tests/serve_search_fixture.py
Never imports app.main until DATABASE_URL points at the temporary database.
"""

from datetime import datetime, timedelta
import os
from pathlib import Path
import sys
from tempfile import TemporaryDirectory

import uvicorn


def seed(db):
    from app.models import Post, Tag
    tag = Tag(name="测试标签")
    db.add(tag)
    date = datetime(2026, 1, 1, 8)
    db.add(Post(title="置顶旧文", slug="pinned-old", content="普通文章正文", is_pinned=True,
                created_at=date, updated_at=date))
    db.add(Post(title="树的结构", slug="tree", content="第一段介绍树。\n\n第二段讨论旋转。\n\n第三段平衡。",
                created_at=date + timedelta(days=1), updated_at=date, tags=[tag]))
    db.add(Post(title="旋转与树", slug="rotation", content="正文也有树与旋转。",
                created_at=date + timedelta(days=2), updated_at=date))
    for index in range(23):
        db.add(Post(title=f"分页测试 {index:02}", slug=f"page-{index}", content="中文正文 `C++ a.b % _`\n\n下一段 搜索",
                    created_at=date + timedelta(days=index), updated_at=date))
    db.add(Post(title="超长 搜索 " + "中文" * 100 + "W" * 180, slug="long-safe",
                content='`<img src=x onerror="window.searchXss=1">` &amp; `C++`\n\n' + "代码" * 200 + "needle" + "W" * 250,
                created_at=date, updated_at=date, tags=[tag]))
    db.add(Post(title="仅标题词", slug="title-only", content="独立正文", created_at=date, updated_at=date))
    db.add(Post(title='安全 <img src=x onerror="window.searchTitleXss=1">', slug="safe-title",
                content="普通正文", created_at=date, updated_at=date))
    db.commit()


def main():
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    with TemporaryDirectory(prefix="dreamland-search-", dir=os.getenv("SEARCH_FIXTURE_TEMP")) as directory:
        os.environ["DATABASE_URL"] = "sqlite:///" + (Path(directory) / "fixture.db").as_posix()
        os.environ["CORS_ORIGINS"] = "http://127.0.0.1:5178"
        os.environ["ADMIN_SECRET"] = "isolated-search-test-only"
        os.environ["SITE_URL"] = "http://127.0.0.1:5178"
        from app.main import app
        from app.database import SessionLocal, engine

        with SessionLocal() as db:
            seed(db)
        print("Isolated search fixture ready (temporary database only).", flush=True)
        try:
            uvicorn.run(app, host="127.0.0.1", port=8017, access_log=False)
        finally:
            engine.dispose()


if __name__ == "__main__":
    main()
