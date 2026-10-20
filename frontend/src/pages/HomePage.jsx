// src/pages/HomePage.jsx

import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getPosts, getTags } from "../api/client";
import PostListItem from "../components/PostListItem";
import ProfileCard from "../components/ProfileCard";
import PostsSearch from "../components/PostsSearch";

function HomePage() {
  const location = useLocation();
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
      <PostsSearch key={location.key}
        sidebar={<ProfileCard postCount={posts.length} tagCount={tags.length} />}>
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
      </PostsSearch>
    </section>
  );
}

export default HomePage;
