// src/pages/HomePage.jsx

import { useEffect, useState } from "react";
import { getPosts, getTags } from "../api/client";
import PostListItem from "../components/PostListItem";
import ProfileCard from "../components/ProfileCard";

function HomePage() {
  const [posts, setPosts] = useState([]);
  const [tags, setTags] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchHomeData() {
      try {
        setLoading(true);
        setError("");

        // 同时请求文章和标签，提高一点效率
        const [postsData, tagsData] = await Promise.all([
          getPosts(),
          getTags(),
        ]);

        setPosts(postsData);
        setTags(tagsData);
      } catch (err) {
        console.error("首页数据加载失败:", err);
        setError("加载首页失败，请检查后端是否启动。");
      } finally {
        setLoading(false);
      }
    }

    fetchHomeData();
  }, []);

  return (
    <section className="page-section">
      <div className="home-layout">
        {/* 左侧个人卡片 */}
        <div className="home-sidebar">
          <ProfileCard postCount={posts.length} tagCount={tags.length} />
        </div>

        {/* 右侧文章列表 */}
        <div className="home-main">
          {loading && <p className="muted-text">Loading posts...</p>}

          {!loading && error && <p className="error-text">{error}</p>}

          {!loading && !error && posts.length === 0 && (
            <p className="muted-text">还没有文章，先去后台发一篇吧。</p>
          )}

          {!loading && !error && posts.length > 0 && (
            <div className="post-list">
              {posts.map((post) => (
                <PostListItem key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default HomePage;