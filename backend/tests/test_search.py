"""Behavior checks through the real API and an isolated in-memory database."""

from datetime import datetime
import unittest

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.models import Post, Tag
from app.routers.posts import router


def plain(parts):
    return "".join(part["text"] for part in parts)


class SearchTests(unittest.TestCase):
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

    def tearDown(self):
        self.client.close()
        self.engine.dispose()

    def post(self, title="文章", content="正文", **kwargs):
        with self.sessions() as db:
            row = Post(title=title, content=content, slug=f"post-{db.query(Post).count() + 1}",
                       created_at=datetime(2026, 1, 1), **kwargs)
            db.add(row)
            db.commit()
            return row.id

    def search(self, q, page="1"):
        response = self.client.get("/posts/search/", params={"q": q, "page": page})
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

    def test_chinese_and_terms_across_title_and_distinct_paragraphs(self):
        both = self.post("树的结构", "第一段旋转。\n\n下一段平衡。")
        body = self.post("数据结构", "树在这里\n\n旋转在另一段\n\n平衡")
        self.post("树", "只有旋转，没有第三词。")
        self.post("平衡", "只有一个词。")
        self.assertEqual(self.search("树")["total"], 3)
        self.assertEqual([p["id"] for p in self.search("树 旋转 平衡")["items"]], [both, body])

    def test_whitespace_case_deduplication(self):
        self.post("Python", "旋转 python PYTHON")
        result = self.search(" \nPYTHON　 python\t旋转  PYthon \n")
        self.assertEqual(result["total"], 1)
        self.assertEqual(result["keywords"], ["python", "旋转"])
        self.assertEqual(self.search("\n　 \t")["items"], [])

    def test_literal_symbols_no_sql_or_regex_wildcards(self):
        exact = self.post("符号", "% _ C++ a.b [x] (a) .* \\")
        self.post("对照", "anything Ccc axb")
        for query in ["%", "_", "C++", "a.b", "[x]", "(a)", ".*", "\\"]:
            with self.subTest(query=query):
                self.assertEqual([p["id"] for p in self.search(query)["items"]], [exact])

    def test_metadata_never_participates(self):
        self.post("普通", "普通", summary="摘要独占")
        with self.sessions() as db:
            row = db.query(Post).one()
            row.slug = "slug-only-secret"
            row.tags = [Tag(name="标签独占")]
            db.commit()
        for query in ["摘要独占", "slug-only-secret", "标签独占"]:
            self.assertEqual(self.search(query)["total"], 0)

    def test_markdown_visible_words_code_and_boundaries(self):
        self.post("Markdown", "# 标题文字\n\n**强调**和~~划线~~\n\n[链接文字](https://hidden.invalid/secret-url)\n\n"
                  "可见 https://visible.invalid/path\n\n`inline_code`\n\n```python\nfenced_code = '代码'\n```\n\n"
                  "段落甲\n\n段落乙\n\n| 表头 | 值 |\n| --- | --- |\n| 单元甲 | 单元乙 |\n\n- [x] 已完成\n\n![图片说明](https://image.invalid)")
        for query in ["标题文字", "强调", "划线", "链接文字", "https://visible.invalid/path", "inline_code", "fenced_code", "代码", "单元甲", "已完成"]:
            self.assertEqual(self.search(query)["total"], 1, query)
        for query in ["#", "**", "~~", "```", "hidden.invalid", "secret-url", "段落甲段落乙", "单元甲单元乙", "[x]", "image.invalid", "图片说明"]:
            self.assertEqual(self.search(query)["total"], 0, query)
        snippet = self.search("链接文字")["items"][0]["snippets"][0]
        self.assertEqual(plain(snippet["parts"]), "链接文字")

    def test_inline_formatting_and_entities_match_readable_text(self):
        self.post("文本", "前**中**后 &amp; 尾\n\n&lt;img onerror=alert(1)&gt;")
        self.assertEqual(self.search("前中后")["total"], 1)
        self.assertEqual(self.search("&")["total"], 1)
        self.assertEqual(self.search("amp;")["total"], 0)
        self.assertEqual(self.search("<img")["total"], 1)

    def test_gfm_strikethrough_task_code_and_image_boundaries(self):
        self.post("文本", "前~单线~后\n\n前~~双线~~后\n\n- `[x] done`\n\n图前![图片](image)图后")
        for query in ["前单线后", "前双线后", "[x]"]:
            self.assertEqual(self.search(query)["total"], 1, query)
        for query in ["~", "图前图后", "图片", "image"]:
            self.assertEqual(self.search(query)["total"], 0, query)

    def test_order_uses_distinct_title_terms_created_at_then_id(self):
        old = self.post("树 旋转 树 树", "", updated_at=datetime(2020, 1, 1))
        tie1 = self.post("树 旋转", "", updated_at=datetime(2030, 1, 1))
        tie2 = self.post("树 旋转", "")
        partial = self.post("树 树 树", "旋转", is_pinned=True)
        with self.sessions() as db:
            db.get(Post, old).created_at = datetime(2025, 1, 1)
            db.get(Post, partial).created_at = datetime(2027, 1, 1)
            db.commit()
        self.assertEqual([p["id"] for p in self.search("树 旋转")["items"]], [tie2, tie1, old, partial])

    def test_pagination_total_and_invalid_page_policy(self):
        ids = [self.post(f"分页 {index}", "") for index in range(23)]
        pages = [self.search("分页", page) for page in ["1", "2", "3"]]
        self.assertEqual([len(p["items"]) for p in pages], [10, 10, 3])
        self.assertEqual([p["total"] for p in pages], [23, 23, 23])
        self.assertEqual([post["id"] for page in pages for post in page["items"]], ids[::-1])
        for invalid in ["0", "-1", "abc", "2.5", "9" * 100]:
            self.assertEqual(self.search("分页", invalid)["page"], 1)
        self.assertEqual(self.search("分页", "999")["page"], 3)
        self.assertEqual(self.search("无匹配", "999")["page"], 1)

    def test_highlights_are_original_safe_structured_text(self):
        title = '<script>alert("x")</script> C++ A.B'
        self.post(title, '`<img src=x onerror="alert(1)">` &amp; C++ a.b')
        item = self.search("ALERT C++ a.b")["items"][0]
        self.assertEqual(plain(item["title"]), title)
        self.assertEqual([part["text"] for part in item["title"] if part["highlight"]], ["alert", "C++", "A.B"])
        self.assertIn('<img src=x onerror="alert(1)"> & C++ a.b', plain(item["snippets"][0]["parts"]))
        self.assertEqual(item["created_at"], "2026-01-01T00:00:00")

    def test_nearby_hits_merge_and_truncation_has_context(self):
        self.post("正文", "前" * 100 + "alpha 与 beta" + "后" * 100)
        snippets = self.search("alpha beta")["items"][0]["snippets"]
        self.assertEqual(len(snippets), 1)
        self.assertTrue(snippets[0]["leading_ellipsis"])
        self.assertTrue(snippets[0]["trailing_ellipsis"])
        self.assertIn("alpha 与 beta", plain(snippets[0]["parts"]))

    def test_distant_terms_multiple_snippets_max_three_without_filtering_post(self):
        self.post("正文", "甲词\n\n乙词\n\n丙词\n\n丁词")
        result = self.search("甲词 乙词 丙词 丁词")
        self.assertEqual(result["total"], 1)
        self.assertEqual(len(result["items"][0]["snippets"]), 3)
        self.assertEqual(len(self.search("甲词 丁词")["items"][0]["snippets"]), 2)

    def test_snippets_prefer_new_term_over_repeated_hits_and_stay_short(self):
        self.post("正文", "alpha " * 300 + "\n\nbeta" + "\n\ngamma")
        snippets = self.search("alpha beta gamma")["items"][0]["snippets"]
        visible = " ".join(plain(s["parts"]) for s in snippets)
        self.assertIn("beta", visible)
        self.assertIn("gamma", visible)
        self.assertLess(len(visible), 400)

    def test_title_only_match_has_no_body_snippet_or_pin_metadata(self):
        self.post("标题独占", "普通正文", is_pinned=True)
        result = self.search("标题独占")["items"][0]
        self.assertEqual(result["snippets"], [])
        self.assertEqual(result["tags"], [])
        self.assertNotIn("is_pinned", result)

    def test_read_only_and_normal_list_pin_order_unchanged(self):
        self.post("匹配旧文", "正文", is_pinned=True)
        self.post("匹配新文", "正文")
        before = self.client.get("/posts/").json()
        self.search("匹配")
        after = self.client.get("/posts/").json()
        self.assertEqual(before, after)
        self.assertTrue(after[0]["is_pinned"])
        # A pre-existing post whose slug is 'search' keeps its detail route.
        with self.sessions() as db:
            db.query(Post).first().slug = "search"
            db.commit()
        self.assertEqual(self.client.get("/posts/search").status_code, 200)


if __name__ == "__main__":
    unittest.main()
