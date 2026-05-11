from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI(title="MyBlog API")

# Allow the frontend dev server (Vite) to talk to this API during development.
# In production you'd lock this down to your deployed frontend origin.
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


@app.get("/posts", response_model=List[Post])
async def list_posts():
    """Return a short list of posts.

    This is a stub for development. Later we will replace this with
    a database-backed implementation or a filesystem-based loader.
    """
    return [
        {"id": 1, "title": "示例文章一", "excerpt": "这是文章的摘要，展示布局与样式..."},
        {"id": 2, "title": "示例文章二", "excerpt": "第二篇文章的摘要，更多内容在点击后查看。"},
    ]


@app.get("/posts/{post_id}", response_model=Post)
async def get_post(post_id: int):
    """Return a single post by id. Currently returns a stub.

    In a fuller implementation this would query a database or read the
    markdown files from the repository and return the rendered content.
    """
    posts = [
        {"id": 1, "title": "示例文章一", "excerpt": "这是文章的摘要，展示布局与样式..."},
        {"id": 2, "title": "示例文章二", "excerpt": "第二篇文章的摘要，更多内容在点击后查看。"},
    ]

    for p in posts:
        if p["id"] == post_id:
            return p

    # FastAPI will automatically return a 404 if we raise an HTTPException,
    # but keeping this simple for now by letting the router handle missing results.
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Post not found")
