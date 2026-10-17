import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageTitle from "../components/PageTitle";
import MarkdownContent from "../components/MarkdownContent";
import { getNow } from "../api/now";
import { formatNowDate } from "../api/nowDate";
import "../styles/now.css";

export function NowView({ data }) {
  const { content, cuts } = data;
  const focuses = content?.focuses.filter(item => item.title.trim()) || [];
  return (
    <div className="content-width now-page">
      <PageTitle title="Now" />
      <div className="now-intro">
        <p className="now-subtitle">最近在做什么</p>
        {content && <p className="muted-text">近况更新于 <time dateTime={content.content_updated_at}>{formatNowDate(content.content_updated_at)}</time></p>}
      </div>
      <section className="now-section" aria-label="近况概述">
        {content ? <div className="markdown-body"><MarkdownContent>{content.overview}</MarkdownContent></div>
          : <p className="muted-text">近况还未整理好，之后会在这里更新。</p>}
      </section>
      <section className="now-section" aria-labelledby="now-focus-heading">
        <h2 id="now-focus-heading">currently focus on</h2>
        <p className="muted-text">有些正在做，有些还在想。它们是此刻占据我注意力的事情与领域。</p>
        {focuses.length ? <ol className="now-focus-list">
          {focuses.map((item, index) => <li key={index}>
            <span className="now-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <div className="now-focus-text"><h3>{item.title}</h3>
              <div className="markdown-body"><MarkdownContent>{item.description}</MarkdownContent></div>
            </div>
          </li>)}
        </ol> : <p className="muted-text">关注内容尚未公布。</p>}
      </section>
      <section className="now-section" aria-labelledby="now-cut-heading">
        <h2 id="now-cut-heading">最近的 Cut</h2>
        {cuts.length ? cuts.map((cut, index) => <article className="now-cut" key={cut.slug}>
          <h3><Link to={`/posts/${encodeURIComponent(cut.slug)}`}>{cut.title}</Link></h3>
          <p className="muted-text"><time dateTime={cut.created_at}>{formatNowDate(cut.created_at)}</time></p>
          {index === 0 && cut.summary?.trim() && <p className="now-cut-summary">{cut.summary}</p>}
        </article>) : <p className="muted-text">还没有发布的 Cut。</p>}
        <Link className="now-text-link" to={`/tags?tag=${encodeURIComponent("片段收集")}`}>查看全部 Cut →</Link>
      </section>
      <section className="now-section" aria-labelledby="now-log-heading">
        <h2 id="now-log-heading">日常记录 · Log</h2>
        {content?.log_description && <div className="markdown-body"><MarkdownContent>{content.log_description}</MarkdownContent></div>}
        {content?.log_url ? <p><a className="now-text-link" href={content.log_url} target="_blank" rel="noopener noreferrer">打开我的 Log ↗</a><span className="now-log-note muted-text">在 Simplenote 阅读</span></p>
          : <p className="muted-text">Log 阅读链接尚未配置。</p>}
      </section>
    </div>
  );
}

export default function NowPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    getNow().then(result => { if (active) setData(result); })
      .catch(() => { if (active) setError("Now 暂时加载失败，请稍后重试。"); });
    return () => { active = false; };
  }, [attempt]);
  return <section className="page-section">
    {error ? <div className="content-width"><p role="alert" className="error-text">{error}</p><button className="secondary-button" onClick={() => { setError(""); setAttempt(attempt + 1); }}>重新加载</button></div>
      : data ? <NowView data={data} /> : <div className="content-width"><p role="status" className="muted-text">正在加载近况…</p></div>}
  </section>;
}
