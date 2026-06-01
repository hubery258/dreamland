// src/pages/PostDetailPage.jsx

import Giscus from "@giscus/react";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { getPostBySlug } from "../api/client";
import PageTitle from "../components/PageTitle";

/**
 * 把日期格式化成更适合显示的形式
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function PostDetailPage() {
  // 从 URL 中获取 slug，例如 /posts/我的第一篇文章
  const { slug } = useParams();

  // state管理
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPost() {
      try {
        setLoading(true);
        setError("");

        // 获取后端数据的函数保存在client.js中
        const data = await getPostBySlug(slug);
        setPost(data);
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

  if (!post) {
    return null;
  }

  return (
    <section className="page-section">
      <div className="content-width">
        {/* 顶部元信息 + 大标题 */}
        <PageTitle
          eyebrow={`Written by hubery on ${formatDate(post.created_at)}`}
          title={post.title}
        />

        {/* 标签区 */}
        {post.tags && post.tags.length > 0 && (
          <div className="post-tags-row">
            {post.tags.map((tag) => (
              <Link key={tag.id} to={`/tags?tag=${encodeURIComponent(tag.name)}`} className="tag-pill">
                {tag.name}
              </Link>
            ))}
          </div>
        )}

        {/* 正文区域，react-markdown 会把 Markdown 转成 HTML 结构 */}
        <article className="markdown-body">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </article>
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