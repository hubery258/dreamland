"""RSS 2.0 rendering and HTTP-cache helpers."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from email.utils import format_datetime
from html import escape
from html.parser import HTMLParser
import hashlib
import os
import re
from typing import Iterable
from urllib.parse import quote, urljoin, urlparse
import xml.etree.ElementTree as ET

import nh3
from markdown_it import MarkdownIt


CONTENT_NS = "http://purl.org/rss/1.0/modules/content/"
ATOM_NS = "http://www.w3.org/2005/Atom"
DC_NS = "http://purl.org/dc/elements/1.1/"

ET.register_namespace("content", CONTENT_NS)
ET.register_namespace("atom", ATOM_NS)
ET.register_namespace("dc", DC_NS)

_XML_INVALID_RANGES = (
    (0x00, 0x08),
    (0x0B, 0x0C),
    (0x0E, 0x1F),
    (0x7F, 0x84),
    (0x86, 0x9F),
    (0xD800, 0xDFFF),
    (0xFFFE, 0xFFFF),
)
_BLOCK_TAGS = {"p", "div", "blockquote", "pre", "li", "h1", "h2", "h3", "h4", "h5", "h6"}
_HTML_TAGS = {
    "a", "blockquote", "br", "code", "em", "h1", "h2", "h3", "h4", "h5", "h6",
    "hr", "img", "li", "ol", "p", "pre", "strong", "ul",
}
_HTML_ATTRIBUTES = {
    "a": {"href", "title"},
    "img": {"src", "alt", "title"},
}
_VOID_TAGS = {"br", "hr", "img"}
_DANGEROUS_CONTENT_TAGS = {
    "audio", "canvas", "embed", "form", "iframe", "object", "script", "style", "svg", "video",
}
_MARKDOWN = MarkdownIt("commonmark", {"html": False, "linkify": False, "typographer": False})


class FeedConfigurationError(ValueError):
    """Raised when the public feed cannot be generated safely."""


@dataclass(frozen=True)
class FeedConfig:
    site_url: str
    title: str
    description: str
    author: str
    limit: int
    id_namespace: str

    @classmethod
    def from_env(cls) -> "FeedConfig":
        site_url = os.getenv("SITE_URL", "").strip().rstrip("/")
        parsed_site_url = urlparse(site_url)
        if (
            parsed_site_url.scheme not in {"http", "https"}
            or not parsed_site_url.netloc
            or parsed_site_url.query
            or parsed_site_url.fragment
        ):
            raise FeedConfigurationError("SITE_URL must be an explicit http(s) origin")

        raw_limit = os.getenv("RSS_LIMIT", "50").strip()
        try:
            limit = int(raw_limit)
        except ValueError as exc:
            raise FeedConfigurationError("RSS_LIMIT must be an integer") from exc
        if not 1 <= limit <= 500:
            raise FeedConfigurationError("RSS_LIMIT must be between 1 and 500")

        id_namespace = os.getenv("RSS_ID_NAMESPACE", "urn:dreamland:rss").strip()
        if not id_namespace:
            raise FeedConfigurationError("RSS_ID_NAMESPACE must not be empty")

        return cls(
            site_url=site_url,
            title=os.getenv("RSS_TITLE", "Dreamland").strip() or "Dreamland",
            description=os.getenv("RSS_DESCRIPTION", "Dreamland 文章更新").strip(),
            author=os.getenv("RSS_AUTHOR", "Dreamland").strip() or "Dreamland",
            limit=limit,
            id_namespace=id_namespace,
        )

    @property
    def feed_url(self) -> str:
        return urljoin(f"{self.site_url}/", "rss.xml")

    def post_url(self, slug: str) -> str:
        return urljoin(f"{self.site_url}/", f"posts/{quote(slug, safe='')}")


def _strip_invalid_xml_chars(value: str) -> str:
    def valid(character: str) -> bool:
        codepoint = ord(character)
        return not any(start <= codepoint <= end for start, end in _XML_INVALID_RANGES)

    return "".join(character for character in str(value) if valid(character))


def _utc_datetime(value: datetime) -> datetime:
    if not isinstance(value, datetime):
        raise FeedConfigurationError("post created_at must be a valid datetime")
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _canonical_created_at(value: datetime) -> str:
    return _utc_datetime(value).isoformat(timespec="microseconds").replace("+00:00", "Z")


def _resolve_url(value: str | None, base_url: str, allowed_schemes: set[str]) -> str | None:
    if not value:
        return None
    candidate = value.strip()
    if not candidate:
        return None

    parsed_candidate = urlparse(candidate)
    if parsed_candidate.scheme and parsed_candidate.scheme.lower() not in allowed_schemes:
        return None

    resolved = urljoin(base_url, candidate)
    parsed_resolved = urlparse(resolved)
    if parsed_resolved.scheme.lower() not in allowed_schemes or not parsed_resolved.netloc:
        return None
    return resolved


class _SafeHtmlRewriter(HTMLParser):
    """Normalize Markdown HTML URLs before the final nh3 allowlist pass."""

    def __init__(self, base_url: str):
        super().__init__(convert_charrefs=True)
        self.base_url = base_url
        self.parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        if tag not in _HTML_TAGS:
            return

        output_attrs: list[str] = []
        allowed_attrs = _HTML_ATTRIBUTES.get(tag, set())
        for name, value in attrs:
            name = name.lower()
            if name not in allowed_attrs or value is None:
                continue
            if name == "href":
                value = _resolve_url(value, self.base_url, {"http", "https", "mailto"})
            elif name == "src":
                value = _resolve_url(value, self.base_url, {"http", "https"})
            if value is None:
                continue
            output_attrs.append(f' {name}="{escape(value, quote=True)}"')

        self.parts.append(f"<{tag}{''.join(output_attrs)}>")

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag in _HTML_TAGS and tag not in _VOID_TAGS:
            self.parts.append(f"</{tag}>")

    def handle_data(self, data: str) -> None:
        self.parts.append(escape(data, quote=False))

    def handle_comment(self, data: str) -> None:
        return

    def html(self) -> str:
        return "".join(self.parts)


class _PlainTextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []

    def handle_data(self, data: str) -> None:
        self.parts.append(data)

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() in _BLOCK_TAGS:
            self.parts.append(" ")

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() in _BLOCK_TAGS:
            self.parts.append(" ")


def _plain_text(markdown: str) -> str:
    rendered = _MARKDOWN.render(markdown or "")
    parser = _PlainTextExtractor()
    parser.feed(rendered)
    return re.sub(r"\s+", " ", "".join(parser.parts)).strip()


def sanitize_markdown(markdown: str, article_url: str) -> str:
    """Render Markdown into safe, reader-friendly HTML."""
    rendered = _MARKDOWN.render(markdown or "")
    source_link = (
        f'<p><a href="{escape(article_url, quote=True)}">查看原文 / 参与讨论</a></p>'
    )

    rewriter = _SafeHtmlRewriter(article_url)
    rewriter.feed(f"{rendered}{source_link}")
    return nh3.clean(
        rewriter.html(),
        tags=_HTML_TAGS,
        clean_content_tags=_DANGEROUS_CONTENT_TAGS,
        attributes=_HTML_ATTRIBUTES,
        link_rel="noopener noreferrer",
        url_schemes={"http", "https", "mailto"},
        url_relative="deny",
    )


def _description(post) -> str:
    supplied_summary = _plain_text(post.summary or "")
    text = supplied_summary or _plain_text(post.content or "")
    if len(text) > 200:
        return f"{text[:200].rstrip()}…"
    return text


def _post_guid(post, config: FeedConfig) -> str:
    return f"{config.id_namespace}:post:{post.id}:{_canonical_created_at(post.created_at)}"


def build_feed_bytes(posts: Iterable, config: FeedConfig) -> bytes:
    """Build deterministic RSS bytes from an iterable of Post-like objects."""
    root = ET.Element("rss", {"version": "2.0"})
    channel = ET.SubElement(root, "channel")
    ET.SubElement(channel, "title").text = _strip_invalid_xml_chars(config.title)
    ET.SubElement(channel, "link").text = _strip_invalid_xml_chars(config.site_url)
    ET.SubElement(channel, "description").text = _strip_invalid_xml_chars(config.description)
    ET.SubElement(channel, "language").text = "zh-CN"
    ET.SubElement(
        channel,
        f"{{{ATOM_NS}}}link",
        {"rel": "self", "type": "application/rss+xml", "href": config.feed_url},
    )

    for post in posts:
        created_at = _utc_datetime(post.created_at)
        item = ET.SubElement(channel, "item")
        post_url = config.post_url(post.slug)
        ET.SubElement(item, "title").text = _strip_invalid_xml_chars(post.title)
        ET.SubElement(item, "link").text = _strip_invalid_xml_chars(post_url)
        ET.SubElement(item, "guid", {"isPermaLink": "false"}).text = _strip_invalid_xml_chars(
            _post_guid(post, config)
        )
        ET.SubElement(item, "pubDate").text = format_datetime(created_at, usegmt=True)
        ET.SubElement(item, f"{{{DC_NS}}}creator").text = _strip_invalid_xml_chars(config.author)

        tag_names = sorted(
            {tag.name.strip() for tag in (post.tags or []) if tag.name and tag.name.strip()},
            key=str.casefold,
        )
        for tag_name in tag_names:
            ET.SubElement(item, "category").text = _strip_invalid_xml_chars(tag_name)

        ET.SubElement(item, "description").text = _strip_invalid_xml_chars(_description(post))
        content = sanitize_markdown(post.content or "", post_url)
        ET.SubElement(item, f"{{{CONTENT_NS}}}encoded").text = _strip_invalid_xml_chars(content)

    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def etag_for(content: bytes) -> str:
    return f'"{hashlib.sha256(content).hexdigest()}"'


def if_none_match_matches(header: str | None, etag: str) -> bool:
    if not header:
        return False
    return any(
        candidate.strip() == "*"
        or candidate.strip().removeprefix("W/") == etag
        for candidate in header.split(",")
    )
