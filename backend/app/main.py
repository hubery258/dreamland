from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import os
import glob
import yaml

app = FastAPI(title="MyBlog API")

# Allow the frontend dev server (Vite) to talk to this API during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Post(BaseModel):
    id: int
    title: str
    excerpt: str
    slug: str | None = None


def load_markdown_posts(posts_dir: str):
    """Load posts from a Jekyll-style _posts directory.

    This function reads all files in `posts_dir`, parses YAML front matter
    (between `---` lines) and returns a list of dicts with keys: id, title,
    excerpt, slug, and the raw content under `content`.
    """
    results = []
    files = sorted(glob.glob(os.path.join(posts_dir, "*.md")))
    for i, path in enumerate(files, start=1):
        with open(path, 'r', encoding='utf-8') as f:
            text = f.read()

        front = {}
        content = text
        if text.startswith('---'):
            # split off front matter
            parts = text.split('---', 2)
            if len(parts) >= 3:
                _, fm_text, rest = parts
                try:
                    front = yaml.safe_load(fm_text) or {}
                except Exception:
                    front = {}
                content = rest.strip()

        title = front.get('title') or front.get('Title') or os.path.basename(path)
        excerpt = front.get('excerpt') or (content[:200] + '...')
        slug = os.path.splitext(os.path.basename(path))[0]

        results.append({
            'id': i,
            'title': title,
            'excerpt': excerpt,
            'slug': slug,
            'content': content,
            'path': path,
        })

    return results


@app.get("/posts", response_model=List[Post])
async def list_posts():
    """Return posts by reading Markdown files from the workspace _posts folder.

    It looks for the folder `d:/blogs/hubery258.github.io/_posts` by default.
    """
    posts_dir = os.path.abspath(r"d:\blogs\hubery258.github.io\_posts")
    if not os.path.isdir(posts_dir):
        # Fallback to sample data if the folder isn't available.
        return [
            {"id": 1, "title": "示例文章一", "excerpt": "这是文章的摘要..."},
            {"id": 2, "title": "示例文章二", "excerpt": "第二篇文章的摘要..."},
        ]

    md_posts = load_markdown_posts(posts_dir)
    # Map to Post model (exclude content for the list)
    return [
        {"id": p['id'], "title": p['title'], "excerpt": p['excerpt'], "slug": p['slug']} for p in md_posts
    ]


@app.get("/posts/{post_id}")
async def get_post(post_id: int):
    """Return a single post with full content by numeric id.

    Also support lookup by slug via query param `?slug=...` in future.
    """
    posts_dir = os.path.abspath(r"d:\blogs\hubery258.github.io\_posts")
    if not os.path.isdir(posts_dir):
        raise HTTPException(status_code=404, detail="Posts directory not found")

    md_posts = load_markdown_posts(posts_dir)
    for p in md_posts:
        if p['id'] == post_id:
            return p

    raise HTTPException(status_code=404, detail="Post not found")
