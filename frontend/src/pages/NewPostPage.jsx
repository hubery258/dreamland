import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { createPost, getPostBySlug, updatePost } from "../api/client";

function parseTags(tagInput) {
  return tagInput
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function NewPostPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const isEditing = Boolean(slug);

  const [adminSecret, setAdminSecret] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  const [loadingPost, setLoadingPost] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!isEditing) return undefined;

    let cancelled = false;

    async function loadPost() {
      try {
        setLoadingPost(true);
        setError("");
        const post = await getPostBySlug(slug);
        if (cancelled) return;
        setTitle(post.title);
        setSummary(post.summary || "");
        setContent(post.content);
        setTagInput((post.tags || []).map((tag) => tag.name).join(", "));
        setIsPinned(post.is_pinned);
      } catch (err) {
        console.error("加载待编辑文章失败:", err);
        if (!cancelled) setError("文章加载失败，请确认文章存在且后端已启动。");
      } finally {
        if (!cancelled) setLoadingPost(false);
      }
    }

    loadPost();
    return () => {
      cancelled = true;
    };
  }, [isEditing, slug]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!adminSecret.trim()) {
      setError("请先输入管理员密钥。");
      return;
    }
    if (!title.trim()) {
      setError("标题不能为空。");
      return;
    }
    if (!content.trim()) {
      setError("正文不能为空。");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccessMessage("");

      const payload = {
        title: title.trim(),
        summary: summary.trim(),
        content: content.trim(),
        is_pinned: isPinned,
        tags: parseTags(tagInput),
      };

      const savedPost = isEditing
        ? await updatePost(slug, payload, adminSecret.trim())
        : await createPost(payload, adminSecret.trim());

      setSuccessMessage(isEditing ? "文章修改成功，正在返回..." : "文章发布成功，正在跳转...");
      window.setTimeout(() => navigate(`/posts/${savedPost.slug}`), 600);
    } catch (err) {
      console.error(isEditing ? "修改文章失败:" : "发布文章失败:", err);
      if (err.status === 401) {
        setError("管理员密钥错误，无法保存文章。");
      } else if (err.status === 500) {
        setError("服务器未配置管理员密钥，请检查后端环境变量 ADMIN_SECRET。");
      } else {
        setError("保存失败，请检查后端是否启动，或管理员密钥是否正确。");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingPost) {
    return (
      <section className="page-section">
        <div className="content-width">
          <p className="muted-text">Loading editor...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="wide-content-width">
        <div className="editor-page-grid">
          <div className="editor-panel">
            <div className="editor-heading-block">
              <p className="page-eyebrow">Admin</p>
              <h1 className="editor-page-title">{isEditing ? "Edit Post" : "New Post"}</h1>
              <div className="page-title-underline editor-underline-left" />
            </div>

            <form className="post-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="admin-secret" className="form-label">
                  管理员密钥 Admin Secret
                </label>
                <input
                  id="admin-secret"
                  type="password"
                  className="form-input"
                  value={adminSecret}
                  onChange={(event) => setAdminSecret(event.target.value)}
                  placeholder="请输入管理员密钥"
                  autoComplete="current-password"
                />
                <p className="form-help-text">只有输入正确的管理员密钥，后端才会保存文章。</p>
              </div>

              <div className="form-group">
                <label htmlFor="title" className="form-label">标题 Title</label>
                <input
                  id="title"
                  type="text"
                  className="form-input"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="例如：湖边小记 03"
                />
              </div>

              <div className="form-group">
                <label htmlFor="summary" className="form-label">摘要 Summary</label>
                <textarea
                  id="summary"
                  className="form-textarea form-textarea-summary"
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  placeholder="文章列表页会显示这段摘要。"
                />
              </div>

              <div className="form-group">
                <label htmlFor="tags" className="form-label">标签 Tags</label>
                <input
                  id="tags"
                  type="text"
                  className="form-input"
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  placeholder="用英文逗号分隔，例如：随笔, 阅读, 写作练习"
                />
                <p className="form-help-text">多个标签请用英文逗号 <code>,</code> 分隔。</p>
              </div>

              <div className="form-group">
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(event) => setIsPinned(event.target.checked)}
                  />
                  <span>设为置顶文章</span>
                </label>
              </div>

              <div className="form-group">
                <label htmlFor="content" className="form-label">正文 Content (Markdown)</label>
                <textarea
                  id="content"
                  className="form-textarea form-textarea-content"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder={"# 输入 Markdown 正文\n\n## 小标题\n\n这是一段正文，可以写 **粗体**、列表、引用等。"}
                />
              </div>

              {error && <p className="error-text">{error}</p>}
              {successMessage && <p className="success-text">{successMessage}</p>}

              <div className="form-actions">
                <button type="submit" className="submit-button" disabled={submitting}>
                  {submitting
                    ? (isEditing ? "Saving..." : "Publishing...")
                    : (isEditing ? "Save Changes" : "Publish Post")}
                </button>
              </div>
            </form>
          </div>

          <div className="editor-preview-panel">
            <div className="editor-preview-header">
              <h2 className="editor-preview-title">Preview</h2>
            </div>
            <div className="editor-preview-body">
              {title.trim() ? (
                <>
                  <h1 className="preview-post-title">{title}</h1>
                  <div className="preview-post-underline" />
                  {summary.trim() && <p className="preview-post-summary">{summary}</p>}
                  {tagInput.trim() && (
                    <div className="post-tags-row post-tags-row-left">
                      {parseTags(tagInput).map((tag) => (
                        <span key={tag} className="tag-pill">{tag}</span>
                      ))}
                    </div>
                  )}
                  <article className="markdown-body">
                    <ReactMarkdown>{content || "右侧会实时预览 Markdown 内容。"}</ReactMarkdown>
                  </article>
                </>
              ) : (
                <div className="preview-empty">
                  <p className="muted-text">这里会实时预览你写的文章内容。</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default NewPostPage;