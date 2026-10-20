"""Read-only, linear Posts search for a small personal blog (no persistent index)."""

from __future__ import annotations

from dataclasses import dataclass
from bisect import bisect_left, bisect_right
import re

from markdown_it import MarkdownIt
from markdown_it.rules_inline.state_inline import Delimiter
from sqlalchemy.orm import Session, selectinload

from ..models import Post
from ..search_schemas import SearchPost, SearchResults, SearchSnippet, TextPart


# Match the current ReactMarkdown + remark-gfm display: raw HTML is literal text,
# tables/strikethrough are syntax, code is text, link destinations are hidden.
def _strike_tokens(state, silent):
    """remark-gfm accepts paired single OR double tildes, but not longer runs."""
    if silent or state.src[state.pos] != "~":
        return False
    scanned = state.scanDelims(state.pos, True)
    if scanned.length not in {1, 2}:
        state.pending += "~" * scanned.length
        state.pos += scanned.length
        return True
    token = state.push("text", "", 0)
    token.content = "~" * scanned.length
    state.delimiters.append(Delimiter(
        marker=0x7E + scanned.length, length=0, token=len(state.tokens) - 1,
        end=-1, open=scanned.can_open, close=scanned.can_close,
    ))
    state.pos += scanned.length
    return True


def _strike_pairs(state):
    def process(delimiters):
        for opening in delimiters:
            if opening.marker not in {0x7F, 0x80} or opening.end < 0:
                continue
            closing = delimiters[opening.end]
            for delimiter, kind, nesting in [(opening, "s_open", 1), (closing, "s_close", -1)]:
                token = state.tokens[delimiter.token]
                token.markup = token.content
                token.type, token.tag, token.nesting, token.content = kind, "s", nesting, ""
    process(state.delimiters)
    for meta in state.tokens_meta:
        if meta and "delimiters" in meta:
            process(meta["delimiters"])


_MARKDOWN = MarkdownIt("commonmark", {"html": True}).enable(["table", "strikethrough"])
_MARKDOWN.inline.ruler.at("strikethrough", _strike_tokens)
_MARKDOWN.inline.ruler2.at("strikethrough", _strike_pairs)
PAGE_SIZE = 10
CONTEXT = 48
MAX_SNIPPETS = 3


def keywords_for(query: str) -> list[str]:
    return list(dict.fromkeys(word.casefold() for word in query.split()))


def readable_blocks(markdown: str) -> list[str]:
    """Keep block boundaries; inline formatting never interrupts visible words."""
    blocks = []
    tokens = _MARKDOWN.parse(markdown or "")
    list_depth = 0
    item_first_paragraph = False
    for token in tokens:
        if token.type in {"bullet_list_open", "ordered_list_open"}:
            list_depth += 1
        elif token.type in {"bullet_list_close", "ordered_list_close"}:
            list_depth -= 1
        elif token.type == "list_item_open":
            item_first_paragraph = True
        elif token.type == "inline":
            parts = []
            for index, child in enumerate(token.children or []):
                if child.type in {"text", "code_inline", "html_inline"}:
                    text = child.content
                    if index == 0 and child.type == "text" and list_depth and item_first_paragraph:
                        text = re.sub(r"^\[[ xX]\][ \t\n]+", "", text)
                    parts.append(text)
                elif child.type in {"softbreak", "hardbreak"}:
                    parts.append("\n")
                elif child.type == "image":
                    parts.append("\n")
                # Images render as images; alt/title/src are not body text.
            text = "".join(parts)
            item_first_paragraph = False
            if text:
                blocks.append(text)
        elif token.type in {"fence", "code_block", "html_block"}:
            blocks.append(token.content.rstrip("\n"))
    return blocks


def occurrences(text: str, keywords: list[str]) -> list[tuple[int, int, int]]:
    """Literal case-insensitive matches, mapped back to original text offsets."""
    folded = []
    offsets = []
    for index, char in enumerate(text):
        lowered = char.casefold()
        folded.append(lowered)
        offsets.extend([index] * len(lowered))
    normalized = "".join(folded)
    found = []
    for term_index, term in enumerate(keywords):
        start = 0
        while (position := normalized.find(term, start)) >= 0:
            found.append((offsets[position], offsets[position + len(term) - 1] + 1, term_index))
            start = position + 1
    return sorted(found)


def text_parts(text: str, matches: list[tuple[int, int, int]], start=0, end=None) -> list[TextPart]:
    end = len(text) if end is None else end
    ranges = []
    for left, right, _ in matches:
        left, right = max(left, start), min(right, end)
        if left >= right:
            continue
        if ranges and left <= ranges[-1][1]:
            ranges[-1] = (ranges[-1][0], max(right, ranges[-1][1]))
        else:
            ranges.append((left, right))
    parts = []
    cursor = start
    for left, right in ranges:
        if cursor < left:
            parts.append(TextPart(text=text[cursor:left]))
        parts.append(TextPart(text=text[left:right], highlight=True))
        cursor = right
    if cursor < end:
        parts.append(TextPart(text=text[cursor:end]))
    return parts


@dataclass
class Window:
    block: int
    start: int
    end: int
    terms: set[int]


def snippets_for(blocks: list[str], matches: list[list[tuple[int, int, int]]]) -> list[SearchSnippet]:
    # Choose short windows greedily to cover different keywords. At most three
    # windows are selected BEFORE merging, so a dense article cannot expand into
    # one unbounded excerpt through a chain of adjacent hits.
    candidates = []
    for block, hits in enumerate(matches):
        text = blocks[block]
        by_term = {}
        for left, right, term in hits:
            starts, ends = by_term.setdefault(term, ([], []))
            starts.append(left)
            ends.append(right)
        for starts, ends in by_term.values():
            starts.sort()
            ends.sort()
        for left, right, _ in hits:
            start, end = max(0, left - CONTEXT), min(len(text), right + CONTEXT)
            terms = {term for term, (starts, ends) in by_term.items()
                     if bisect_left(starts, end) > bisect_right(ends, start)}
            candidates.append(Window(block, start, end, terms))
    chosen = []
    covered = set()
    while candidates and len(chosen) < MAX_SNIPPETS:
        best = max(candidates, key=lambda w: (len(w.terms - covered), len(w.terms), -w.block, -w.start))
        chosen.append(best)
        covered.update(best.terms)
        candidates = [w for w in candidates if not (
            w.block == best.block and w.start >= best.start and w.end <= best.end
        )]
    merged = []
    for window in sorted(chosen, key=lambda w: (w.block, w.start)):
        if merged and window.block == merged[-1].block and window.start <= merged[-1].end:
            merged[-1].end = max(merged[-1].end, window.end)
        else:
            merged.append(window)
    return [SearchSnippet(
        parts=text_parts(blocks[w.block], matches[w.block], w.start, w.end),
        leading_ellipsis=w.start > 0,
        trailing_ellipsis=w.end < len(blocks[w.block]),
    ) for w in merged]


def normalize_page(raw: str) -> int:
    # Avoid huge integer parsing and normalize all malformed/nonpositive values.
    return int(raw) if re.fullmatch(r"[0-9]{1,9}", raw) and int(raw) > 0 else 1


def search_posts(db: Session, query: str, raw_page: str = "1") -> SearchResults:
    query = query.strip()
    keywords = keywords_for(query)
    if not keywords:
        return SearchResults(query="", keywords=[], total=0, page=1, total_pages=0, items=[])
    matched = []
    # No LIMIT before matching. Tags are loaded only for the final page below;
    # summary, slug, dates, tags and pin status never participate in matching.
    for post in db.query(Post).yield_per(100):
        title_hits = occurrences(post.title, keywords)
        blocks = readable_blocks(post.content)
        body_hits = [occurrences(block, keywords) for block in blocks]
        title_terms = {term for _, _, term in title_hits}
        all_terms = title_terms | {term for hits in body_hits for _, _, term in hits}
        if len(all_terms) == len(keywords):
            matched.append((len(title_terms), post.created_at, post.id))
    matched.sort(reverse=True)
    total = len(matched)
    total_pages = (total + PAGE_SIZE - 1) // PAGE_SIZE
    page = min(normalize_page(raw_page), max(1, total_pages))
    ids = [row[2] for row in matched[(page - 1) * PAGE_SIZE:page * PAGE_SIZE]]
    posts = {post.id: post for post in db.query(Post).options(selectinload(Post.tags)).filter(Post.id.in_(ids))}
    items = []
    for post_id in ids:
        post = posts[post_id]
        blocks = readable_blocks(post.content)
        items.append(SearchPost(
            id=post.id, slug=post.slug, created_at=post.created_at, tags=post.tags,
            title=text_parts(post.title, occurrences(post.title, keywords)),
            snippets=snippets_for(blocks, [occurrences(block, keywords) for block in blocks]),
        ))
    return SearchResults(query=query, keywords=keywords, total=total, page=page, total_pages=total_pages, items=items)
