import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getAbout, updateAbout } from "../api/client";
import { aboutBody } from "../api/aboutContent";
import MarkdownContent from "../components/MarkdownContent";
import PageTitle from "../components/PageTitle";
import "../styles/about.css";

export default function AboutAdminPage() {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("About");
  const [secret, setSecret] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [dirty, setDirty] = useState(false);
  const pending = useRef(false);

  useEffect(() => {
    let active = true;
    getAbout().then(data => {
      if (!active) return;
      setContent(aboutBody(data.about_content));
      setTitle(data.about_title || "About");
      setLoaded(true);
    }).catch(() => {
      if (active) setError("加载失败，暂不能保存，以免覆盖已有内容。请重新加载。");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);

  useEffect(() => {
    if (!dirty) return;
    function warn(event) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function submit(event) {
    event.preventDefault();
    if (!loaded || pending.current) return;
    setError("");
    setSuccess("");
    if (!secret.trim()) { setError("请先输入管理员密钥。"); return; }
    if (!content.trim()) { setError("正文不能为空。"); return; }
    pending.current = true;
    setSaving(true);
    try {
      const result = await updateAbout({ about_content: content }, secret);
      setContent(result.about_content);
      setDirty(false);
      setSuccess("About 已保存并公开，可打开公开页面查看。");
    } catch (err) {
      setError(err.status === 401
        ? "管理员密钥错误，输入内容已保留。"
        : "保存失败，请检查网络或服务器配置后重试。输入内容已保留。");
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  return <section className="page-section"><div className="content-width about-admin">
    <PageTitle eyebrow="Admin" title="维护 About" />
    <p><Link to="/about" target="_blank" rel="noreferrer">查看公开页面 ↗</Link></p>
    {loading && <p role="status">正在加载…</p>}
    {!loaded && error && <p className="error-text" role="alert">{error}</p>}
    {!loaded && !loading && <button className="secondary-button" onClick={() => {
      setLoading(true); setError(""); setAttempt(value => value + 1);
    }}>重新加载</button>}
    {loaded && <>
      <form className="post-form" onSubmit={submit}>
        <fieldset className="about-fieldset" disabled={saving}>
          <div className="form-group">
            <label className="form-label" htmlFor="about-secret">管理员密钥</label>
            <input id="about-secret" className="form-input" type="password" autoComplete="current-password" required value={secret} onChange={event => setSecret(event.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="about-content">正文（Markdown）</label>
            <textarea id="about-content" className="form-textarea form-textarea-content" required value={content} onChange={event => {
              setContent(event.target.value); setDirty(true); setSuccess("");
            }} />
          </div>
          <button type="submit" className="submit-button">{saving ? "正在保存…" : "保存并公开 About"}</button>
        </fieldset>
        {dirty && <p className="muted-text">有尚未保存的修改。</p>}
        {error && <p className="error-text" role="alert">{error}</p>}
        {success && <p className="success-text" role="status">{success}</p>}
      </form>
      <section className="about-preview" aria-label="About 正文预览">
        <p className="muted-text">预览</p>
        <PageTitle title={title} />
        <article className="markdown-body about-body"><MarkdownContent>{content}</MarkdownContent></article>
      </section>
    </>}
  </div></section>;
}
