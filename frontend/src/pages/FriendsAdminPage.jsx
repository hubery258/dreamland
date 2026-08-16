import { useEffect, useState } from "react";
import {
  createFriend,
  deleteFriend,
  getFriends,
  updateFriend,
} from "../api/client";

function errorMessage(error) {
  if (error.status === 401) return "管理员密钥错误。";
  if (error.status === 500) return "服务器未配置 ADMIN_SECRET。";
  try {
    const payload = JSON.parse(error.message);
    return payload.detail || "操作失败。";
  } catch {
    return error.message || "操作失败。";
  }
}

function FriendsAdminPage() {
  const [friends, setFriends] = useState([]);
  const [adminSecret, setAdminSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [avatar, setAvatar] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  async function refreshFriends() {
    setFriends(await getFriends());
  }

  useEffect(() => {
    async function load() {
      try {
        await refreshFriends();
      } catch (err) {
        console.error("友链管理页加载失败:", err);
        setError("Friends 数据加载失败，请检查后端是否启动。");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function requireSecret() {
    if (!adminSecret.trim()) {
      setError("请先输入管理员密钥。");
      return false;
    }
    return true;
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setDescription("");
    setUrl("");
    setAvatar("");
    setSortOrder(0);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearMessages();
    if (!requireSecret()) return;
    if (!name.trim() || !url.trim()) {
      setError("友链名称和站点 URL 不能为空。");
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      url: url.trim(),
      avatar: avatar.trim(),
      sort_order: Number(sortOrder) || 0,
    };

    try {
      setWorking(true);
      if (editingId) {
        await updateFriend(editingId, payload, adminSecret.trim());
        setSuccess("友链已更新。");
      } else {
        await createFriend(payload, adminSecret.trim());
        setSuccess("友链已创建。");
      }
      resetForm();
      await refreshFriends();
    } catch (err) {
      console.error("保存友链失败:", err);
      setError(errorMessage(err));
    } finally {
      setWorking(false);
    }
  }

  function beginEdit(friend) {
    clearMessages();
    setEditingId(friend.id);
    setName(friend.name);
    setDescription(friend.description || "");
    setUrl(friend.url);
    setAvatar(friend.avatar || "");
    setSortOrder(friend.sort_order ?? 0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(friend) {
    clearMessages();
    if (!requireSecret()) return;
    if (!window.confirm(`确定删除友链“${friend.name}”吗？`)) return;

    try {
      setWorking(true);
      await deleteFriend(friend.id, adminSecret.trim());
      if (editingId === friend.id) resetForm();
      await refreshFriends();
      setSuccess("友链已删除。");
    } catch (err) {
      console.error("删除友链失败:", err);
      setError(errorMessage(err));
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <section className="page-section">
        <div className="content-width"><p className="muted-text">Loading friends manager...</p></div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="gallery-admin-width">
        <div className="editor-heading-block gallery-admin-heading">
          <p className="page-eyebrow">Admin</p>
          <h1 className="editor-page-title">Manage Friends</h1>
          <div className="page-title-underline editor-underline-left" />
        </div>

        <div className="gallery-admin-secret">
          <label htmlFor="friends-admin-secret" className="form-label">
            管理员密钥 Admin Secret
          </label>
          <input
            id="friends-admin-secret"
            type="password"
            className="form-input"
            value={adminSecret}
            onChange={(event) => setAdminSecret(event.target.value)}
            autoComplete="current-password"
            placeholder="新增、编辑或删除时需要"
          />
        </div>

        {error && <p className="error-text gallery-admin-message">{error}</p>}
        {success && <p className="success-text gallery-admin-message">{success}</p>}

        <div className="friends-admin-grid">
          <section className="gallery-admin-panel">
            <h2>{editingId ? "Edit Friend" : "New Friend"}</h2>
            <form className="post-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="friend-name" className="form-label">友链名称</label>
                <input
                  id="friend-name"
                  className="form-input"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="例如：A Nice Blog"
                />
              </div>
              <div className="form-group">
                <label htmlFor="friend-description" className="form-label">简介</label>
                <textarea
                  id="friend-description"
                  className="form-textarea form-textarea-summary"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="可选"
                />
              </div>
              <div className="form-group">
                <label htmlFor="friend-url" className="form-label">站点 URL</label>
                <input
                  id="friend-url"
                  type="url"
                  className="form-input"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="form-group">
                <label htmlFor="friend-avatar" className="form-label">头像 URL</label>
                <input
                  id="friend-avatar"
                  type="url"
                  className="form-input"
                  value={avatar}
                  onChange={(event) => setAvatar(event.target.value)}
                  placeholder="可留空，将显示占位头像"
                />
              </div>
              {avatar && (
                <div className="friends-admin-preview">
                  <img src={avatar} alt="当前头像预览" />
                </div>
              )}
              <div className="form-group">
                <label htmlFor="friend-order" className="form-label">显示顺序</label>
                <input
                  id="friend-order"
                  type="number"
                  className="form-input"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                  step="1"
                  placeholder="数字越小越靠前"
                />
              </div>
              <div className="gallery-admin-form-actions">
                <button className="submit-button" type="submit" disabled={working}>
                  {editingId ? "Save Friend" : "Add Friend"}
                </button>
                {editingId && (
                  <button className="secondary-button" type="button" onClick={resetForm}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="gallery-admin-photos friends-admin-current">
            <h2>Current Friends</h2>
            <div className="gallery-admin-photo-list">
              {friends.map((friend) => (
                <article className="gallery-admin-photo-row friends-admin-row" key={friend.id}>
                  {friend.avatar ? (
                    <img src={friend.avatar} alt="" loading="lazy" />
                  ) : (
                    <div className="friends-admin-placeholder">IMG</div>
                  )}
                  <div className="gallery-admin-photo-info">
                    <strong>{friend.name}</strong>
                    <span>顺序：{friend.sort_order}</span>
                    <p>{friend.description || friend.url}</p>
                  </div>
                  <div className="gallery-admin-row-actions">
                    <button type="button" onClick={() => beginEdit(friend)}>Edit</button>
                    <button type="button" onClick={() => handleDelete(friend)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
            {friends.length === 0 && (
              <p className="muted-text">还没有友链，使用左侧表单添加第一张卡片。</p>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}

export default FriendsAdminPage;
