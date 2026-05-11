import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

// PostDetail: explains how the component works for newcomers.
// Responsibilities:
// - Read `:id` from the URL via `useParams()`.
// - Fetch the full post JSON from the backend and render it.
// - Handle loading/error/missing states in a user-friendly way.
export default function PostDetail() {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // URL to fetch the single post. Update if your API is hosted elsewhere.
    const url = `http://localhost:8000/posts/${id}`

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok')
        return res.json()
      })
      .then(data => setPost(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p>加载中…</p>
  if (error) return <p>加载失败：{error}</p>
  if (!post) return <p>未找到文章。</p>

  // For simplicity we render `post.excerpt` as the body. When we import
  // Markdown files later we'll render their HTML here.
  return (
    <article className="post">
      <h1 className="post-title">{post.title}</h1>
      <div className="post-info">ID: {post.id}</div>
      <p>{post.excerpt}</p>
      <p><em>（真实文章内容将从 Markdown 文件加载并渲染为 HTML。）</em></p>
    </article>
  )
}
