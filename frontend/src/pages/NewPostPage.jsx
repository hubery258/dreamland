// src/pages/NewPostPage.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { createPost } from "../api/client";

/**
 * 把用户输入的 tags 字符串转成数组
 * 例如：
 * "随笔, 阅读, 哲学"
 * =>
 * ["随笔", "阅读", "哲学"]
 */
function parseTags(tagInput) {
  return tagInput
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function NewPostPage() {
  const navigate = useNavigate();

  // 表单数据
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  // 页面状态
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    // 基础校验：标题和正文不能为空
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

      // 组装要发给后端的数据
      const payload = {
        title: title.trim(),
        summary: summary.trim(),
        content: content.trim(),
        is_pinned: isPinned,
        tags: parseTags(tagInput),
      };

      // 调用后端 API 创建文章
      const createdPost = await createPost(payload);

      setSuccessMessage("文章发布成功，正在跳转...");

      // 发布成功后跳到新文章详情页
      setTimeout(() => {
        navigate(`/posts/${createdPost.slug}`);
      }, 800);
    } catch (err) {
      console.error("发布文章失败:", err);
      setError("发布失败，请检查后端是否启动，或者请求数据是否正确。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page-section">
      <div className="wide-content-width">
        <div className="editor-page-grid">
          {/* 左侧：表单区域 */}
          <div className="editor-panel">
            <div className="editor-heading-block">
              <p className="page-eyebrow">Admin</p>
              <h1 className="editor-page-title">New Post</h1>
              <div className="page-title-underline editor-underline-left" />
            </div>

            <form className="post-form" onSubmit={handleSubmit}>
              {/* 标题 */}
              <div className="form-group">
                <label htmlFor="title" className="form-label">
                  标题 Title
                </label>
                <input
                  id="title"
                  type="text"
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例如：湖边小记 03"
                />
              </div>

              {/* 摘要 */}
              <div className="form-group">
                <label htmlFor="summary" className="form-label">
                  摘要 Summary
                </label>
                <textarea
                  id="summary"
                  className="form-textarea form-textarea-summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="文章列表页会显示这段摘要。"
                />
              </div>

              {/* 标签 */}
              <div className="form-group">
                <label htmlFor="tags" className="form-label">
                  标签 Tags
                </label>
                <input
                  id="tags"
                  type="text"
                  className="form-input"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="用英文逗号分隔，例如：随笔, 阅读, 写作练习"
                />
                <p className="form-help-text">
                  多个标签请用英文逗号 <code>,</code> 分隔。
                </p>
              </div>

              {/* 是否置顶 */}
              <div className="form-group">
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                  />
                  <span>设为置顶文章</span>
                </label>
              </div>

              {/* 正文 */}
              <div className="form-group">
                <label htmlFor="content" className="form-label">
                  正文 Content (Markdown)
                </label>
                <textarea
                  id="content"
                  className="form-textarea form-textarea-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="# 输入 Markdown 正文

例如：

## 小标题

这是一段正文，可以写 **粗体**、列表、引用等。"
                />
              </div>

              {/* 提示信息 */}
              {error && <p className="error-text">{error}</p>}
              {successMessage && <p className="success-text">{successMessage}</p>}

              {/* 提交按钮 */}
              <div className="form-actions">
                <button
                  type="submit"
                  className="submit-button"
                  disabled={submitting}
                >
                  {submitting ? "Publishing..." : "Publish Post"}
                </button>
              </div>
            </form>
          </div>

          {/* 右侧：Markdown 预览 */}
          <div className="editor-preview-panel">
            <div className="editor-preview-header">
              <h2 className="editor-preview-title">Preview</h2>
            </div>

            <div className="editor-preview-body">
              {title.trim() ? (
                <>
                  <h1 className="preview-post-title">{title}</h1>
                  <div className="preview-post-underline" />

                  {summary.trim() && (
                    <p className="preview-post-summary">{summary}</p>
                  )}

                  {tagInput.trim() && (
                    <div className="post-tags-row post-tags-row-left">
                      {parseTags(tagInput).map((tag) => (
                        <span key={tag} className="tag-pill">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <article className="markdown-body">
                    <ReactMarkdown>
                      {content || "右侧会实时预览 Markdown 内容。"}
                    </ReactMarkdown>
                  </article>
                </>
              ) : (
                <div className="preview-empty">
                  <p className="muted-text">
                    这里会实时预览你写的文章内容。
                  </p>
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