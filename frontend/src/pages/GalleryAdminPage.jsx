import { useEffect, useState } from "react";
import {
  createAlbum,
  createPhoto,
  deleteAlbum,
  deletePhoto,
  getGallery,
  updateAlbum,
  updatePhoto,
} from "../api/client";

function apiDate(value) {
  if (value instanceof Date) return value;
  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
  return new Date(hasTimezone ? value : `${value}Z`);
}

function localDateTimeValue(value = new Date()) {
  const date = apiDate(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

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

function GalleryAdminPage() {
  const [gallery, setGallery] = useState({ albums: [], photos: [] });
  const [adminSecret, setAdminSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingAlbumId, setEditingAlbumId] = useState(null);
  const [albumTitle, setAlbumTitle] = useState("");
  const [albumDescription, setAlbumDescription] = useState("");

  const [editingPhotoId, setEditingPhotoId] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [photoAlbumId, setPhotoAlbumId] = useState("");
  const [submittedAt, setSubmittedAt] = useState(localDateTimeValue());
  const [note, setNote] = useState("");
  const [alt, setAlt] = useState("");

  async function refreshGallery() {
    const data = await getGallery();
    setGallery(data);
  }

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        await refreshGallery();
      } catch (err) {
        console.error("管理页加载失败:", err);
        setError("Gallery 数据加载失败，请检查后端是否启动。");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function requireSecret() {
    if (!adminSecret.trim()) {
      setError("请先输入管理员密钥。");
      return false;
    }
    return true;
  }

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function resetAlbumForm() {
    setEditingAlbumId(null);
    setAlbumTitle("");
    setAlbumDescription("");
  }

  function resetPhotoForm() {
    setEditingPhotoId(null);
    setImageUrl("");
    setThumbnailUrl("");
    setPhotoAlbumId("");
    setSubmittedAt(localDateTimeValue());
    setNote("");
    setAlt("");
  }

  async function handleAlbumSubmit(event) {
    event.preventDefault();
    clearMessages();
    if (!requireSecret()) return;
    if (!albumTitle.trim()) {
      setError("相册名称不能为空。");
      return;
    }

    try {
      setWorking(true);
      const payload = {
        title: albumTitle.trim(),
        description: albumDescription.trim(),
      };
      if (editingAlbumId) {
        await updateAlbum(editingAlbumId, payload, adminSecret.trim());
        setSuccess("相册已更新。");
      } else {
        await createAlbum(payload, adminSecret.trim());
        setSuccess("相册已创建。");
      }
      resetAlbumForm();
      await refreshGallery();
    } catch (err) {
      console.error("保存相册失败:", err);
      setError(errorMessage(err));
    } finally {
      setWorking(false);
    }
  }

  function beginAlbumEdit(album) {
    clearMessages();
    setEditingAlbumId(album.id);
    setAlbumTitle(album.title);
    setAlbumDescription(album.description || "");
  }

  async function handleAlbumDelete(album) {
    clearMessages();
    if (!requireSecret()) return;
    if (!window.confirm(`删除相册“${album.title}”？其中的照片会移到未分类。`)) return;

    try {
      setWorking(true);
      await deleteAlbum(album.id, adminSecret.trim());
      if (editingAlbumId === album.id) resetAlbumForm();
      await refreshGallery();
      setSuccess("相册已删除，原有照片已移到未分类。");
    } catch (err) {
      console.error("删除相册失败:", err);
      setError(errorMessage(err));
    } finally {
      setWorking(false);
    }
  }

  async function handlePhotoSubmit(event) {
    event.preventDefault();
    clearMessages();
    if (!requireSecret()) return;
    if (!imageUrl.trim()) {
      setError("原图 URL 不能为空。");
      return;
    }

    try {
      setWorking(true);
      const payload = {
        album_id: photoAlbumId ? Number(photoAlbumId) : null,
        image_url: imageUrl.trim(),
        thumbnail_url: thumbnailUrl.trim(),
        submitted_at: new Date(submittedAt).toISOString(),
        note: note.trim(),
        alt: alt.trim(),
      };
      if (editingPhotoId) {
        await updatePhoto(editingPhotoId, payload, adminSecret.trim());
        setSuccess("照片信息已更新。");
      } else {
        await createPhoto(payload, adminSecret.trim());
        setSuccess("照片已加入 Gallery。");
      }
      resetPhotoForm();
      await refreshGallery();
    } catch (err) {
      console.error("保存照片失败:", err);
      setError(errorMessage(err));
    } finally {
      setWorking(false);
    }
  }

  function beginPhotoEdit(photo) {
    clearMessages();
    setEditingPhotoId(photo.id);
    setImageUrl(photo.image_url);
    setThumbnailUrl(photo.thumbnail_url || "");
    setPhotoAlbumId(photo.album_id === null ? "" : String(photo.album_id));
    setSubmittedAt(localDateTimeValue(photo.submitted_at));
    setNote(photo.note || "");
    setAlt(photo.alt || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handlePhotoDelete(photo) {
    clearMessages();
    if (!requireSecret()) return;
    if (!window.confirm("确定删除这张照片记录吗？图床中的原图不会被删除。")) return;

    try {
      setWorking(true);
      await deletePhoto(photo.id, adminSecret.trim());
      if (editingPhotoId === photo.id) resetPhotoForm();
      await refreshGallery();
      setSuccess("照片记录已删除，图床原图未受影响。");
    } catch (err) {
      console.error("删除照片失败:", err);
      setError(errorMessage(err));
    } finally {
      setWorking(false);
    }
  }

  const albumNameById = new Map(
    (gallery.albums || []).map((album) => [album.id, album.title]),
  );

  if (loading) {
    return (
      <section className="page-section">
        <div className="content-width"><p className="muted-text">Loading gallery manager...</p></div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="gallery-admin-width">
        <div className="editor-heading-block gallery-admin-heading">
          <p className="page-eyebrow">Admin</p>
          <h1 className="editor-page-title">Manage Gallery</h1>
          <div className="page-title-underline editor-underline-left" />
        </div>

        <div className="gallery-admin-secret">
          <label htmlFor="gallery-admin-secret" className="form-label">
            管理员密钥 Admin Secret
          </label>
          <input
            id="gallery-admin-secret"
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

        <div className="gallery-admin-grid">
          <section className="gallery-admin-panel">
            <h2>{editingAlbumId ? "Edit Album" : "New Album"}</h2>
            <form className="post-form" onSubmit={handleAlbumSubmit}>
              <div className="form-group">
                <label htmlFor="album-title" className="form-label">相册名称</label>
                <input
                  id="album-title"
                  className="form-input"
                  value={albumTitle}
                  onChange={(event) => setAlbumTitle(event.target.value)}
                  placeholder="例如：Summer"
                />
              </div>
              <div className="form-group">
                <label htmlFor="album-description" className="form-label">相册说明</label>
                <textarea
                  id="album-description"
                  className="form-textarea form-textarea-summary"
                  value={albumDescription}
                  onChange={(event) => setAlbumDescription(event.target.value)}
                  placeholder="可选"
                />
              </div>
              <div className="gallery-admin-form-actions">
                <button className="submit-button" type="submit" disabled={working}>
                  {editingAlbumId ? "Save Album" : "Create Album"}
                </button>
                {editingAlbumId && (
                  <button className="secondary-button" type="button" onClick={resetAlbumForm}>
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="gallery-admin-list">
              {(gallery.albums || []).map((album) => (
                <div className="gallery-admin-album-row" key={album.id}>
                  <div>
                    <strong>{album.title}</strong>
                    {album.description && <p>{album.description}</p>}
                  </div>
                  <div className="gallery-admin-row-actions">
                    <button type="button" onClick={() => beginAlbumEdit(album)}>Edit</button>
                    <button type="button" onClick={() => handleAlbumDelete(album)}>Delete</button>
                  </div>
                </div>
              ))}
              {(gallery.albums || []).length === 0 && (
                <p className="muted-text">还没有相册。照片仍可直接放入未分类。</p>
              )}
            </div>
          </section>

          <section className="gallery-admin-panel">
            <h2>{editingPhotoId ? "Edit Photo" : "New Photo"}</h2>
            <form className="post-form" onSubmit={handlePhotoSubmit}>
              <div className="form-group">
                <label htmlFor="photo-url" className="form-label">原图 URL</label>
                <input
                  id="photo-url"
                  type="url"
                  className="form-input"
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="form-group">
                <label htmlFor="thumbnail-url" className="form-label">缩略图 URL</label>
                <input
                  id="thumbnail-url"
                  type="url"
                  className="form-input"
                  value={thumbnailUrl}
                  onChange={(event) => setThumbnailUrl(event.target.value)}
                  placeholder="可留空，将使用原图"
                />
              </div>
              {imageUrl && (
                <div className="gallery-admin-preview">
                  <img src={thumbnailUrl || imageUrl} alt="当前图片预览" />
                </div>
              )}
              <div className="form-group">
                <label htmlFor="photo-album" className="form-label">所属相册</label>
                <select
                  id="photo-album"
                  className="form-input"
                  value={photoAlbumId}
                  onChange={(event) => setPhotoAlbumId(event.target.value)}
                >
                  <option value="">未分类</option>
                  {(gallery.albums || []).map((album) => (
                    <option value={album.id} key={album.id}>{album.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="submitted-at" className="form-label">提交时间</label>
                <input
                  id="submitted-at"
                  type="datetime-local"
                  className="form-input"
                  value={submittedAt}
                  onChange={(event) => setSubmittedAt(event.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="photo-note" className="form-label">备注</label>
                <textarea
                  id="photo-note"
                  className="form-textarea form-textarea-summary"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="点击照片后显示"
                />
              </div>
              <div className="form-group">
                <label htmlFor="photo-alt" className="form-label">替代文字 Alt</label>
                <input
                  id="photo-alt"
                  className="form-input"
                  value={alt}
                  onChange={(event) => setAlt(event.target.value)}
                  placeholder="简短描述图片内容，可选"
                />
              </div>
              <div className="gallery-admin-form-actions">
                <button className="submit-button" type="submit" disabled={working}>
                  {editingPhotoId ? "Save Photo" : "Add Photo"}
                </button>
                {editingPhotoId && (
                  <button className="secondary-button" type="button" onClick={resetPhotoForm}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>

        <section className="gallery-admin-photos">
          <h2>Current Photos</h2>
          <div className="gallery-admin-photo-list">
            {(gallery.photos || []).map((photo) => (
              <article className="gallery-admin-photo-row" key={photo.id}>
                <img src={photo.thumbnail_url || photo.image_url} alt={photo.alt || ""} loading="lazy" />
                <div className="gallery-admin-photo-info">
                  <strong>{albumNameById.get(photo.album_id) || "未分类"}</strong>
                  <time>{apiDate(photo.submitted_at).toLocaleString()}</time>
                  <p>{photo.note || "No note"}</p>
                </div>
                <div className="gallery-admin-row-actions">
                  <button type="button" onClick={() => beginPhotoEdit(photo)}>Edit</button>
                  <button type="button" onClick={() => handlePhotoDelete(photo)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
          {(gallery.photos || []).length === 0 && (
            <p className="muted-text">还没有照片，使用上面的表单添加第一张。</p>
          )}
        </section>
      </div>
    </section>
  );
}

export default GalleryAdminPage;