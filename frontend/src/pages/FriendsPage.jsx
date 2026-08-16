import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFriends } from "../api/client";
import PageTitle from "../components/PageTitle";
import FriendCard from "../components/FriendCard";

function FriendsPage() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadFriends() {
      try {
        setFriends(await getFriends());
      } catch (err) {
        console.error("友链加载失败:", err);
        setError("Friends 加载失败，请检查后端是否启动。");
      } finally {
        setLoading(false);
      }
    }

    loadFriends();
  }, []);

  return (
    <section className="page-section">
      <div className="content-width">
        <PageTitle title="Friends" />

        {loading && <p className="muted-text">Loading friends...</p>}
        {error && <p className="error-text">{error}</p>}
        {!loading && !error && friends.length === 0 && (
          <p className="muted-text">还没有友链，去管理页添加第一张卡片吧。</p>
        )}

        {!loading && !error && friends.length > 0 && (
          <div className="friends-grid">
            {friends.map((friend) => (
              <FriendCard key={friend.id} friend={friend} />
            ))}
          </div>
        )}

        <div className="gallery-admin-entry">
          <Link to="/admin/friends">Manage Friends</Link>
        </div>
      </div>
    </section>
  );
}

export default FriendsPage;
