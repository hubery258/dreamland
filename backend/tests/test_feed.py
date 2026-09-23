import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
import shutil
import tempfile
import unittest
import xml.etree.ElementTree as ET


_TEST_DIR = Path(tempfile.mkdtemp(prefix="dreamland-rss-test-"))
os.environ["DATABASE_URL"] = f"sqlite:///{(_TEST_DIR / 'feed.db').as_posix()}"
os.environ["SITE_URL"] = "https://example.com"
os.environ["RSS_TITLE"] = "Dreamland RSS"
os.environ["RSS_DESCRIPTION"] = "测试订阅"
os.environ["RSS_AUTHOR"] = "Dreamland"
os.environ["RSS_LIMIT"] = "50"
os.environ["RSS_ID_NAMESPACE"] = "urn:test:dreamland"

from fastapi.testclient import TestClient

from app import models
from app.database import SessionLocal, engine
from app.main import app
from app.models import post_tags


CONTENT_NS = "http://purl.org/rss/1.0/modules/content/"
ATOM_NS = "http://www.w3.org/2005/Atom"
DC_NS = "http://purl.org/dc/elements/1.1/"


class FeedEndpointTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def setUp(self):
        with SessionLocal() as db:
            db.execute(post_tags.delete())
            db.query(models.Post).delete(synchronize_session=False)
            db.query(models.Tag).delete(synchronize_session=False)
            db.commit()

    @classmethod
    def tearDownClass(cls):
        engine.dispose()
        shutil.rmtree(_TEST_DIR, ignore_errors=True)

    def add_post(
        self,
        title="测试文章",
        slug="test-post",
        content="# 标题\n\n正文",
        summary="",
        created_at=None,
        tags=None,
        is_pinned=False,
    ):
        with SessionLocal() as db:
            post = models.Post(
                title=title,
                slug=slug,
                content=content,
                summary=summary,
                created_at=created_at or datetime(2025, 1, 1, 12, tzinfo=timezone.utc),
                updated_at=created_at or datetime(2025, 1, 1, 12, tzinfo=timezone.utc),
                is_pinned=is_pinned,
                tags=[models.Tag(name=name) for name in (tags or [])],
            )
            db.add(post)
            db.commit()
            db.refresh(post)
            return post.id

    @staticmethod
    def channel(response):
        root = ET.fromstring(response.content)
        return root, root.find("channel")

    def test_empty_feed_is_valid_and_has_discovery_metadata(self):
        response = self.client.get("/rss.xml")
        self.assertEqual(response.status_code, 200)
        root, channel = self.channel(response)
        self.assertEqual(root.tag, "rss")
        self.assertEqual(channel.findtext("title"), "Dreamland RSS")
        self.assertEqual(channel.findtext("language"), "zh-CN")
        self.assertEqual(channel.find(f"{{{ATOM_NS}}}link").attrib["href"], "https://example.com/rss.xml")
        self.assertEqual(channel.findall("item"), [])
        self.assertEqual(response.headers["content-type"], "application/rss+xml; charset=utf-8")

    def test_full_content_urls_categories_and_stable_order(self):
        self.add_post(
            title="置顶旧文",
            slug="old",
            created_at=datetime(2025, 1, 1, tzinfo=timezone.utc),
            is_pinned=True,
        )
        self.add_post(
            title="中文 & Emoji 😀",
            slug="中文 slug",
            content=(
                "## 正文\n\n"
                "[站外链接](https://example.org/a?x=1&y=2)\n\n"
                "![图片](../images/cover.png \"封面\")\n\n"
                "[危险链接](javascript:alert(1))\n\n"
                "<script>alert(1)</script>"
            ),
            summary="人工摘要",
            created_at=datetime(2025, 1, 2, tzinfo=timezone.utc),
            tags=["随笔", "阅读"],
        )

        response = self.client.get("/rss.xml")
        root, channel = self.channel(response)
        items = channel.findall("item")
        item = items[0]
        content = item.findtext(f"{{{CONTENT_NS}}}encoded")

        self.assertEqual(len(items), 2)
        self.assertEqual(item.findtext("title"), "中文 & Emoji 😀")
        self.assertEqual(item.findtext("link"), "https://example.com/posts/%E4%B8%AD%E6%96%87%20slug")
        self.assertEqual(item.findtext("description"), "人工摘要")
        self.assertEqual(item.findtext(f"{{{DC_NS}}}creator"), "Dreamland")
        self.assertEqual([node.text for node in item.findall("category")], ["阅读", "随笔"])
        self.assertIn('href="https://example.org/a?x=1&amp;y=2"', content)
        self.assertIn('src="https://example.com/images/cover.png"', content)
        self.assertIn("查看原文 / 参与讨论", content)
        self.assertNotIn('href="javascript:', content)
        self.assertNotIn("<script", content)
        self.assertIsNotNone(root.find("channel"))

    def test_edit_changes_etag_but_not_guid_or_pubdate(self):
        post_id = self.add_post(
            title="原始标题",
            slug="stable-id",
            created_at=datetime(2025, 2, 3, 4, 5, 6, 123456),
        )
        before = self.client.get("/rss.xml")
        _, before_channel = self.channel(before)
        before_item = before_channel.find("item")

        with SessionLocal() as db:
            post = db.get(models.Post, post_id)
            post.title = "编辑后的标题"
            post.content = "编辑后的正文"
            post.updated_at = datetime(2026, 2, 3, tzinfo=timezone.utc)
            db.commit()

        after = self.client.get("/rss.xml")
        _, after_channel = self.channel(after)
        after_item = after_channel.find("item")

        self.assertNotEqual(before.headers["etag"], after.headers["etag"])
        self.assertEqual(before_item.findtext("guid"), after_item.findtext("guid"))
        self.assertEqual(before_item.findtext("pubDate"), after_item.findtext("pubDate"))
        self.assertEqual(after_item.findtext("title"), "编辑后的标题")

    def test_conditional_get_head_and_limit(self):
        base = datetime(2025, 3, 1, tzinfo=timezone.utc)
        for index in range(52):
            self.add_post(
                title=f"文章 {index}",
                slug=f"post-{index}",
                created_at=base + timedelta(minutes=index),
                is_pinned=index == 0,
            )

        response = self.client.get("/rss.xml")
        _, channel = self.channel(response)
        items = channel.findall("item")
        self.assertEqual(len(items), 50)
        self.assertEqual(items[0].findtext("title"), "文章 51")
        self.assertEqual(items[-1].findtext("title"), "文章 2")

        conditional = self.client.get(
            "/rss.xml",
            headers={"If-None-Match": f"W/{response.headers['etag']}"},
        )
        self.assertEqual(conditional.status_code, 304)
        self.assertEqual(conditional.content, b"")
        self.assertEqual(conditional.headers["etag"], response.headers["etag"])

        head = self.client.head("/rss.xml")
        self.assertEqual(head.status_code, 200)
        self.assertEqual(head.content, b"")
        self.assertEqual(head.headers["etag"], response.headers["etag"])

    def test_special_characters_and_illegal_xml_controls(self):
        self.add_post(
            title="A & < B \u0001 😀",
            slug="special",
            content="内容 & <标签> \u0002",
        )
        response = self.client.get("/rss.xml")
        _, channel = self.channel(response)
        item = channel.find("item")
        self.assertEqual(item.findtext("title"), "A & < B  😀")
        self.assertIn("内容 &amp; &lt;标签&gt;", item.findtext(f"{{{CONTENT_NS}}}encoded"))

    def test_missing_site_url_is_server_error_not_empty_success(self):
        previous = os.environ.pop("SITE_URL")
        try:
            response = self.client.get("/rss.xml")
        finally:
            os.environ["SITE_URL"] = previous
        self.assertEqual(response.status_code, 500)


if __name__ == "__main__":
    unittest.main()
