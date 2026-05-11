import React, { useEffect, useState } from 'react'

// PostList fetches articles from the FastAPI backend and renders them.
// The component includes simple loading and error handling to keep the
// example approachable for newcomers.
export default function PostList() {
  // posts: array of {id, title, excerpt}
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Fetch posts from our FastAPI backend. The URL assumes backend runs
    // locally on port 8000 (uvicorn). If you deploy the API elsewhere,
    // update this URL or proxy calls in production.
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
      {/* Render a simple list of articles. Each item links to the detail page.
          We keep the markup minimal so styles from the imported SCSS apply.
      */}
      {posts.map(p => (
        <article key={p.id} className="post-item">
          <h2 className="post-title">{p.title}</h2>
          <p>{p.excerpt}</p>
            {/* Use a plain anchor so the router handles the path; we could
              replace this with <Link> from react-router if we want. */}
            <a href={`/posts/${p.id}`}>阅读更多 →</a>
        </article>
      ))}
    </section>
  )
}
