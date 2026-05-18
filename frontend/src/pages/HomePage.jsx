// src/pages/HomePage.jsx

import { useEffect, useState } from "react";
import { getPosts } from "../api/client";
import PostListItem from "../components/PostListItem";

function HomePage() {
  // posts：存文章列表数据
  const [posts, setPosts] = useState([]);

  // loading：控制加载状态
  const [loading, setLoading] = useState(true);

  // error：记录请求错误信息
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);
        setError("");

        const data = await getPosts();
        setPosts(data);
      } catch (err) {
        console.error("获取文章列表失败:", err);
        setError("加载文章失败，请检查后端是否启动。");
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  return (
    <section className="page-section">
      <div className="content-width">
        {/* 加载中 */}
        {loading && <p className="muted-text">Loading posts...</p>}

        {/* 请求失败 */}
        {!loading && error && <p className="error-text">{error}</p>}

        {/* 没有文章 */}
        {!loading && !error && posts.length === 0 && (
          <p className="muted-text">还没有文章，先去后台发一篇吧。</p>
        )}

        {/* 文章列表 */}
        {!loading && !error && posts.length > 0 && (
          <div className="post-list">
            {posts.map((post) => (
              <PostListItem key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default HomePage;