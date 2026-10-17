"""Run separately: python -m unittest discover -s tests -p test_now.py -v.

Uses its own in-memory engine; never imports main or opens blog.db.
"""
import os
import unittest
from datetime import datetime
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.models import Post, Tag
from app.now_models import NowContent
from app.routers.now import router


def payload():
    return {"overview": "## 近况\n\n中文 **Markdown**", "focuses": [
        {"title": f"关注 {index}", "description": f"说明 {index}\n\n- 保留原文"}
        for index in range(1, 11)
    ], "log_description": "日常记录", "log_url": ""}


class NowTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
        Base.metadata.create_all(self.engine)
        self.sessions = sessionmaker(bind=self.engine)
        app = FastAPI()
        app.include_router(router)

        def isolated_db():
            with self.sessions() as db:
                yield db

        app.dependency_overrides[get_db] = isolated_db
        self.client = TestClient(app)
        self.env = patch.dict(os.environ, {"ADMIN_SECRET": "isolated-test-only"})
        self.env.start()
        self.headers = {"X-Admin-Secret": "isolated-test-only"}

    def tearDown(self):
        self.client.close()
        self.engine.dispose()
        self.env.stop()

    def save(self, data):
        return self.client.put("/site/now", json=data, headers=self.headers)

    def test_unconfigured_read_does_not_seed(self):
        self.assertEqual(self.client.get("/site/now").json(), {"content": None, "cuts": []})
        with self.sessions() as db:
            self.assertEqual(db.query(NowContent).count(), 0)

    def test_auth_save_reload_and_raw_markdown_order(self):
        self.assertEqual(self.client.put("/site/now", json=payload()).status_code, 401)
        self.assertEqual(self.client.put("/site/now", json=payload(), headers={"X-Admin-Secret": "wrong"}).status_code, 401)
        data = payload()
        data["focuses"].reverse()
        response = self.save(data)
        self.assertEqual(response.status_code, 200)
        saved = self.client.get("/site/now").json()["content"]
        for key, value in data.items():
            self.assertEqual(saved[key], value)
        self.assertTrue(saved["content_updated_at"].endswith("Z"))
        with patch.dict(os.environ, {"ADMIN_SECRET": ""}):
            self.assertEqual(self.save(data).status_code, 500)

    def test_validation_never_overwrites_complete_content(self):
        before = self.save(payload()).json()
        cases = []
        for count in [11]:
            data = payload()
            data["focuses"] = (data["focuses"] * 2)[:count]
            cases.append(data)
        for field in ["overview", "focuses", "log_url", "log_description"]:
            data = payload()
            del data[field]
            cases.append(data)
        data = payload(); data["overview"] = "  "; cases.append(data)
        data = payload(); data["focuses"][0]["description"] = "x" * 20001; cases.append(data)
        for data in cases:
            with self.subTest(data=str(data)[:80]):
                self.assertEqual(self.save(data).status_code, 422)
                self.assertEqual(self.client.get("/site/now").json()["content"], before)

    def test_optional_focuses_and_blank_titles_round_trip(self):
        for count in [0, 1, 9, 10]:
            data = payload()
            data["focuses"] = data["focuses"][:count]
            if count:
                data["focuses"][0] = {"title": "  ", "description": "未公开说明仍保留"}
            with self.subTest(count=count):
                self.assertEqual(self.save(data).status_code, 200)
                self.assertEqual(self.client.get("/site/now").json()["content"]["focuses"], data["focuses"])

    def test_log_urls(self):
        for url in ["javascript:alert(1)", "data:text/html,test", "file:///test", "//example.org", "https://", "https://example.org:bad", "https://user:pass@example.org", "https://example.org/\ntest", "https://example.org\\test"]:
            data = payload(); data["log_url"] = url
            with self.subTest(url=url):
                self.assertEqual(self.save(data).status_code, 422)
        for url in ["", "https://app.simplenote.com/p/test", "http://example.org/log?x=1#中文"]:
            data = payload(); data["log_url"] = url
            self.assertEqual(self.save(data).status_code, 200)

    def test_content_timestamp_semantics(self):
        data = payload()
        self.save(data)
        # Use a known old timestamp, avoiding sleeps and clock precision assumptions.
        with self.sessions() as db:
            db.get(NowContent, 1).content_updated_at = datetime(2020, 1, 1)
            db.commit()
        before = self.client.get("/site/now").json()["content"]["content_updated_at"]
        self.assertEqual(self.save(data).json()["content_updated_at"], before)
        data["log_url"] = "https://example.org/log"
        data["log_description"] = "仅修改 Log"
        self.assertEqual(self.save(data).json()["content_updated_at"], before)
        data["focuses"].reverse()
        self.assertNotEqual(self.save(data).json()["content_updated_at"], before)
        with self.sessions() as db:
            db.get(NowContent, 1).content_updated_at = datetime(2020, 1, 1)
            db.commit()
        data["overview"] += "\n更新"
        self.assertNotEqual(self.save(data).json()["content_updated_at"], before)

    def test_commit_failure_rolls_back_content_and_timestamp(self):
        before = self.save(payload()).json()
        data = payload(); data["overview"] = "保存应该失败"
        with patch("sqlalchemy.orm.Session.commit", side_effect=OperationalError("test", {}, Exception("test"))):
            self.assertEqual(self.save(data).status_code, 503)
        self.assertEqual(self.client.get("/site/now").json()["content"], before)

    def test_cut_counts_tag_publication_order_and_no_body(self):
        with self.sessions() as db:
            tag = Tag(name="片段收集")
            db.add(Post(title="标题包含 Cut 不算", slug="not-cut", content="private-body", tags=[Tag(name="Cut")]))
            db.commit()
            self.assertEqual(self.client.get("/site/now").json()["cuts"], [])
            for index in range(4):
                db.add(Post(title="中文长标题" * 40, slug=f"cut-{index}", content="never-return-body",
                            summary="已有摘要" if index == 0 else None,
                            tags=[tag], is_pinned=index == 0,
                            created_at=datetime(2025, 1, index + 1, 20),
                            updated_at=datetime(2030, 1, 4 - index)))
                db.commit()
                cuts = self.client.get("/site/now").json()["cuts"]
                self.assertEqual(len(cuts), min(index + 1, 2))
                self.assertEqual(cuts[0]["slug"], f"cut-{index}")
                self.assertNotIn("content", cuts[0])
            self.assertEqual([cut["slug"] for cut in cuts], ["cut-3", "cut-2"])
            self.assertIsNone(cuts[0]["summary"])
        self.assertIsNone(self.client.get("/site/now").json()["content"])


if __name__ == "__main__":
    unittest.main()
