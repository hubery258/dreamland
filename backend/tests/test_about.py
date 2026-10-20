"""Isolated About API checks; never reads or writes the real blog database."""
import os
import unittest
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.models import SiteMeta
from app.routers.site import router


class AboutTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
        Base.metadata.create_all(self.engine)
        self.sessions = sessionmaker(bind=self.engine)
        with self.sessions() as db:
            db.add(SiteMeta(about_title="About", about_content="Existing content"))
            db.commit()
        app = FastAPI()
        app.include_router(router)

        def isolated_db():
            with self.sessions() as db:
                yield db

        app.dependency_overrides[get_db] = isolated_db
        self.client = TestClient(app)
        self.env = patch.dict(os.environ, {"ADMIN_SECRET": "about-test-only"})
        self.env.start()

    def tearDown(self):
        self.client.close()
        self.env.stop()
        self.engine.dispose()

    def test_public_read_and_rejected_writes_preserve_content(self):
        before = self.client.get("/site/about").json()
        for headers in ({}, {"X-Admin-Secret": "incorrect"}):
            response = self.client.put("/site/about", json={"about_content": "overwrite"}, headers=headers)
            self.assertEqual(response.status_code, 401)
            self.assertEqual(self.client.get("/site/about").json(), before)
        with patch.dict(os.environ, {"ADMIN_SECRET": ""}):
            response = self.client.put("/site/about", json={"about_content": "overwrite"})
            self.assertEqual(response.status_code, 500)
        self.assertEqual(self.client.get("/site/about").json(), before)

    def test_long_markdown_save_reload_and_edit_preserve_title(self):
        headers = {"X-Admin-Secret": "about-test-only"}
        markdown = "## 中文标题\n\n**测试**与[链接](https://example.com)\n\n" * 3000
        for content in (markdown, "## 修改后的测试\n\n保留原始空格  \n下一行\n"):
            response = self.client.put("/site/about", json={"about_content": content}, headers=headers)
            self.assertEqual(response.status_code, 200)
            saved = self.client.get("/site/about").json()
            self.assertEqual(saved["about_content"], content)
            self.assertEqual(saved["about_title"], "About")
            with self.sessions() as db:
                self.assertEqual(db.query(SiteMeta).one().about_content, content)


if __name__ == "__main__":
    unittest.main()
