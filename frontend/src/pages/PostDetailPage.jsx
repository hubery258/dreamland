import Giscus from "@giscus/react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { getPostBySlug, getPostNeighbors } from "../api/client";
import PageTitle from "../components/PageTitle";

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function wasEdited(post) {
  const createdAt = new Date(post.created_at).getTime();
  const updatedAt = new Date(post.updated_at).getTime();
  return Number.isFinite(createdAt) && Number.isFinite(updatedAt) && updatedAt - createdAt > 60000;
}

function PostDetailPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [neighbors, setNeighbors] = useState({ older: null, newer: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPost() {
      try {
        setLoading(true);
        setError("");
        const [postData, neighborData] = await Promise.all([
          getPostBySlug(slug),
          getPostNeighbors(slug),
        ]);
        setPost(postData);
        setNeighbors(neighborData);
      } catch (err) {
        console.error("获取文章详情失败:", err);
        setError("文章加载失败，可能是文章不存在，或者后端未启动。");
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <section className="page-section">
        <div className="content-width">
          <p className="muted-text">Loading post...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page-section">
        <div className="content-width">
          <p className="error-text">{error}</p>
        </div>
      </section>
    );
  }

  if (!post) return null;

  return (
    <section className="page-section">
      <div className="content-width">
        <PageTitle
          eyebrow={`Written by hubery on ${formatDate(post.created_at)}`}
          title={post.title}
        />

        {wasEdited(post) && (
          <p className="post-updated-at">
            Last changed on {formatDate(post.updated_at)}
          </p>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="post-tags-row">
            {post.tags.map((tag) => (
              <Link
                key={tag.id}
                to={`/tags?tag=${encodeURIComponent(tag.name)}`}
                className="tag-pill"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}

        <article className="markdown-body">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </article>

        <nav className="post-neighbors" aria-label="Adjacent posts">
          <div className="post-neighbor post-neighbor-older">
            {neighbors.older && (
              <Link to={`/posts/${neighbors.older.slug}`}>
                <span>← Older Post</span>
                <strong>{neighbors.older.title}</strong>
              </Link>
            )}
          </div>
          <div className="post-neighbor post-neighbor-newer">
            {neighbors.newer && (
              <Link to={`/posts/${neighbors.newer.slug}`}>
                <span>Newer Post →</span>
                <strong>{neighbors.newer.title}</strong>
              </Link>
            )}
          </div>
        </nav>

        <div className="post-admin-actions">
          <Link to={`/admin/edit/${post.slug}`} className="post-edit-link">
            Edit this post
          </Link>
        </div>

        <div className="post-comments-section">
          <Giscus
            id="comment"
            repo="hubery258/dreamland"
            repoId="R_kgDOSaFIOw"
            category="comment"
            categoryId="DIC_kwDOSaFIO84C-Qb7"
            mapping="pathname"
            strict="0"
            reactionsEnabled="1"
            emitMetadata="1"
            inputPosition="top"
            theme="light"
            lang="zh-CN"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}

export default PostDetailPage;