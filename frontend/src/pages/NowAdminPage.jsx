import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getNow, saveNow } from "../api/now";
import { formatNowDate } from "../api/nowDate";
import "../styles/now.css";

function emptyForm() {
  return { overview: "", focuses: [], log_description: "", log_url: "" };
}

function editable(content) {
  const { overview, focuses, log_description, log_url } = content;
  return { overview, focuses, log_description, log_url };
}

function errorMessage(error) {
  if (error.status === 401) return "管理员密钥错误，请检查后重试。输入内容已保留。";
  if (error.status === 500) return "服务器暂时无法保存，请检查配置后重试。输入内容已保留。";
  try {
    const { detail } = JSON.parse(error.message);
    if (Array.isArray(detail)) return detail.map(item => `${item.loc.filter(part => part !== "body").join(" / ")}: ${item.msg}`).join("；");
    return typeof detail === "string" ? detail : "保存失败，输入内容已保留。";
  } catch { return "保存失败，请检查网络后重试。输入内容已保留。"; }
}

export default function NowAdminPage() {
  const [form, setForm] = useState(emptyForm);
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const pending = useRef(false);

  useEffect(() => {
    let active = true;
    getNow().then(data => {
      if (!active) return;
      if (data.content) { setForm(editable(data.content)); setUpdatedAt(data.content.content_updated_at); }
      setLoaded(true);
    }).catch(() => { if (active) setError("加载失败，暂不能保存，以免覆盖已有内容。请重新加载。"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);

  function change(key, value) {
    setSuccess("");
    setForm(current => ({ ...current, [key]: value }));
  }
  function changeFocus(index, key, value) {
    change("focuses", form.focuses.map((item, i) => i === index ? { ...item, [key]: value } : item));
  }
  function moveTarget(index, offset) {
    if (!form.focuses[index].title.trim()) return -1;
    for (let target = index + offset; target >= 0 && target < form.focuses.length; target += offset) {
      if (form.focuses[target].title.trim()) return target;
    }
    return -1;
  }
  function move(index, offset) {
    const target = moveTarget(index, offset);
    if (target === -1) return;
    const next = [...form.focuses];
    [next[index], next[target]] = [next[target], next[index]];
    change("focuses", next);
    requestAnimationFrame(() => document.getElementById(`now-title-${target}`)?.focus());
  }
  function removeFocus(index) {
    const item = form.focuses[index];
    if ((item.title || item.description) && !window.confirm("移除此关注项？保存 Now 后生效。")) return;
    change("focuses", form.focuses.filter((_, i) => i !== index));
  }
  async function submit(event) {
    event.preventDefault();
    if (pending.current || !loaded) return;
    setError(""); setSuccess("");
    if (!secret.trim()) { setError("请先输入管理员密钥。"); return; }
    if (!form.overview.trim()) { setError("近况概述不能为空。"); return; }
    if (form.log_url) {
      try {
        const url = new URL(form.log_url);
        if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || /\s|\\/.test(form.log_url)) throw new Error();
      } catch { setError("Log 链接须为完整的 http:// 或 https:// 地址，且不含凭据、空白或反斜杠。"); return; }
    }
    pending.current = true; setWorking(true);
    try {
      const result = await saveNow(form, secret);
      setForm(editable(result)); setUpdatedAt(result.content_updated_at);
      setSuccess("Now 已保存。内容与显示顺序已更新。");
    } catch (err) { setError(errorMessage(err)); }
    finally { pending.current = false; setWorking(false); }
  }

  return <section className="page-section"><div className="content-width now-admin">
    <div className="editor-heading-block"><p className="page-eyebrow">Admin</p><h1 className="editor-page-title">维护 Now</h1></div>
    <p><Link className="now-text-link" to="/now">查看公开页面 →</Link></p>
    <p className="muted-text">概述、关注项及顺序变化会更新近况日期；仅修改 Log 不会更新。所有说明支持 Markdown。</p>
    {updatedAt && <p className="muted-text">近况更新于 {formatNowDate(updatedAt)}</p>}
    {loading && <p role="status">正在加载…</p>}
    {error && !loaded && <p role="alert" className="error-text">{error}</p>}
    {!loading && !loaded && <button className="secondary-button" onClick={() => { setLoading(true); setError(""); setAttempt(attempt + 1); }}>重新加载</button>}
    {loaded && <form className="post-form" onSubmit={submit}>
      <fieldset disabled={working} className="now-fieldset">
        <div className="form-group"><label className="form-label" htmlFor="now-secret">管理员密钥</label><input id="now-secret" className="form-input" type="password" autoComplete="current-password" value={secret} onChange={e => setSecret(e.target.value)} required /></div>
        <div className="form-group"><label className="form-label" htmlFor="now-overview">近况概述（Markdown，必填）</label><textarea id="now-overview" className="form-textarea" maxLength={50000} required value={form.overview} onChange={e => change("overview", e.target.value)} /></div>
        <h2>currently focus on</h2>
        <p className="muted-text">最多 10 项，可按需添加或移除。空标题项不在页面显示，已填写的说明仍会保存。上下移动仅交换有标题的项，说明随之移动；公开编号始终连续。</p>
        {form.focuses.map((item, index) => <fieldset className="now-edit-focus" key={index}>
          <legend>编辑项 {index + 1}{!item.title.trim() && " · 空标题，页面不显示"}</legend>
          <div className="form-group"><label className="form-label" htmlFor={`now-title-${index}`}>标题（可留空）</label><input id={`now-title-${index}`} className="form-input" maxLength={255} value={item.title} onChange={e => changeFocus(index, "title", e.target.value)} /></div>
          <div className="form-group"><label className="form-label" htmlFor={`now-description-${index}`}>说明（Markdown）</label><textarea id={`now-description-${index}`} className="form-textarea" maxLength={20000} value={item.description} onChange={e => changeFocus(index, "description", e.target.value)} /></div>
          <div className="now-move-actions"><button type="button" className="secondary-button" disabled={moveTarget(index, -1) === -1} onClick={() => move(index, -1)} aria-label={`第 ${index + 1} 项上移`}>上移 ↑</button><button type="button" className="secondary-button" disabled={moveTarget(index, 1) === -1} onClick={() => move(index, 1)} aria-label={`第 ${index + 1} 项下移`}>下移 ↓</button><button type="button" className="secondary-button" onClick={() => removeFocus(index)} aria-label={`移除第 ${index + 1} 项`}>移除</button></div>
        </fieldset>)}
        <button type="button" className="secondary-button" disabled={form.focuses.length >= 10} onClick={() => {
          const index = form.focuses.length;
          change("focuses", [...form.focuses, { title: "", description: "" }]);
          requestAnimationFrame(() => document.getElementById(`now-title-${index}`)?.focus());
        }}>添加关注项（{form.focuses.length}/10）</button>
        <h2>日常记录 · Log</h2>
        <div className="form-group"><label className="form-label" htmlFor="now-log-description">Log 说明（Markdown）</label><textarea id="now-log-description" className="form-textarea" maxLength={20000} value={form.log_description} onChange={e => change("log_description", e.target.value)} /></div>
        <div className="form-group"><label className="form-label" htmlFor="now-log-url">公开 Log 链接</label><input id="now-log-url" className="form-input" type="url" maxLength={2048} value={form.log_url} onChange={e => change("log_url", e.target.value)} /><p className="form-help-text">可留空，仅支持 http:// 或 https://。</p></div>
        <button className="submit-button" type="submit" disabled={working}>{working ? "正在保存…" : "保存 Now"}</button>
      </fieldset>
      {error && <p role="alert" className="error-text">{error}</p>}
      {success && <p role="status" className="success-text">{success}</p>}
    </form>}
  </div></section>;
}
