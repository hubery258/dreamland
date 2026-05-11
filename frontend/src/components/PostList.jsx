import React, { useEffect, useState } from 'react'

// PostList fetches articles from the FastAPI backend and renders them.
// The component includes simple loading and error handling to keep the
// example approachable for newcomers.
export default function PostList() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Fetch the posts from the backend. The backend runs on port 8000 by default.
    fetch('http://localhost:8000/posts')
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok')
        return res.json()
      })
      .then(data => setPosts(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>加载中…</p>
  if (error) return <p>加载失败：{error}</p>

  return (
    <section className="post">
      {posts.map(p => (
        <article key={p.id} className="post-item">
          <h2 className="post-title">{p.title}</h2>
          <p>{p.excerpt}</p>
          <a href={`/posts/${p.id}`}>阅读更多 →</a>
        </article>
      ))}
    </section>
  )
}
