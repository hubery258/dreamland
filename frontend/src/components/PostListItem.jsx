// src/components/PostListItem.jsx

import { Link } from "react-router-dom";

/**
 * 把日期格式化得更像博客：
 * 例如：April 23, 2026
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function PostListItem({ post }) {
  return (
    <article className="post-list-item">
      {/* 用 Link 包住整块，让用户点击整块即可进入详情页 */}
      <Link to={`/posts/${post.slug}`} className="post-list-link">
        {/* 日期行 */}
        <p className="post-list-date">
          {post.is_pinned ? "Pinned · " : ""}
          {formatDate(post.created_at)}
        </p>

        {/* 标题 */}
        <h2 className="post-list-title">{post.title}</h2>

        {/* 标题下方短横线
            这个元素会在 hover 时延长，模拟你说的动效 */}
        <div className="post-list-underline" />

        {/* 摘要：有摘要时才显示 */}
        {post.summary && <p className="post-list-summary">{post.summary}</p>}
      </Link>
    </article>
  );
}

export default PostListItem;