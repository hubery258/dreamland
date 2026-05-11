import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

// PostDetail fetches a single post by id from the FastAPI backend.
// The component includes explanatory comments so newcomers can follow along.
export default function PostDetail() {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Build the URL for the API. We assume the backend runs on port 8000.
    const url = `http://localhost:8000/posts/${id}`

    // Fetch the post JSON. In production add better error handling and retries.
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

  // Render a simple article layout. You can expand this to render HTML content.
  return (
    <article className="post">
      <h1 className="post-title">{post.title}</h1>
      <div className="post-info">ID: {post.id}</div>
      <p>{post.excerpt}</p>
      <p><em>（这是一条示例详情；真实文章内容将从后端或文件系统加载。）</em></p>
    </article>
  )
}
