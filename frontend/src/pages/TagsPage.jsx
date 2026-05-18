// src/pages/TagsPage.jsx

import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import PageTitle from "../components/PageTitle";
import { getTags, getPostsByTag } from "../api/client";

/**
 * 日期格式化
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function TagsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // 所有标签
  const [tags, setTags] = useState([]);

  // 当前选中的标签名
  const [activeTag, setActiveTag] = useState(searchParams.get("tag") || "");

  // 某个标签下的文章
  const [tagPosts, setTagPosts] = useState([]);

  const [loadingTags, setLoadingTags] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const [error, setError] = useState("");

  // 先加载所有标签
  useEffect(() => {
    async function fetchTags() {
      try {
        setLoadingTags(true);
        setError("");

        const data = await getTags();
        setTags(data);

        // 如果没有指定 activeTag，就默认选中第一个标签
        if (!activeTag && data.length > 0) {
          const firstTag = data[0].name;
          setActiveTag(firstTag);
          setSearchParams({ tag: firstTag });
        }
      } catch (err) {
        console.error("获取标签失败:", err);
        setError("标签加载失败，请检查后端。");
      } finally {
        setLoadingTags(false);
      }
    }

    fetchTags();
  }, []);

  // 每当 activeTag 改变时，请求该标签下文章
  useEffect(() => {
    async function fetchTagPosts() {
      if (!activeTag) return;

      try {
        setLoadingPosts(true);
        setError("");

        const data = await getPostsByTag(activeTag);
        setTagPosts(data.posts || []);
      } catch (err) {
        console.error("获取标签文章失败:", err);
        setError("标签文章加载失败。");
      } finally {
        setLoadingPosts(false);
      }
    }

    fetchTagPosts();
  }, [activeTag]);

  function handleSelectTag(tagName) {
    setActiveTag(tagName);
    setSearchParams({ tag: tagName });
  }

  return (
    <section className="page-section">
      <div className="content-width">
        <PageTitle title="Tags" />

        {/* 标签按钮区 */}
        {loadingTags && <p className="muted-text">Loading tags...</p>}
        {!loadingTags && error && <p className="error-text">{error}</p>}

        {!loadingTags && !error && tags.length > 0 && (
          <div className="tags-cloud">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleSelectTag(tag.name)}
                className={
                  activeTag === tag.name
                    ? "tag-pill-button tag-pill-active"
                    : "tag-pill-button"
                }
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}

        {/* 当前标签下文章 */}
        {activeTag && (
          <section className="tag-posts-section">
            <h2 className="tag-section-title">#{activeTag}</h2>

            {loadingPosts && <p className="muted-text">Loading posts...</p>}

            {!loadingPosts && tagPosts.length === 0 && !error && (
              <p className="muted-text">这个标签下还没有文章。</p>
            )}

            {!loadingPosts && tagPosts.length > 0 && (
              <div className="tag-post-list">
                {tagPosts.map((post) => (
                  <div key={post.id} className="tag-post-row">
                    <Link to={`/posts/${post.slug}`} className="tag-post-link">
                      {post.title}
                    </Link>
                    <span className="tag-post-date">
                      {formatDate(post.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </section>
  );
}

export default TagsPage;