import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import { searchPosts } from "../api/search";
import "../styles/search.css";

function HighlightedText({ parts }) {
  return parts.map((part, index) => part.highlight
    ? <mark key={index}>{part.text}</mark>
    : <span key={index}>{part.text}</span>);
}

function SearchPost({ post }) {
  // Same publication field and browser-local date formatting as PostListItem.
  const date = new Date(post.created_at).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  return (
    <article className="post-list-item search-post">
      <p className="post-list-date"><time dateTime={post.created_at}>{date}</time></p>
      <h2 className="post-list-title">
        <Link to={`/posts/${encodeURIComponent(post.slug)}`}><HighlightedText parts={post.title} /></Link>
      </h2>
      {post.tags.length > 0 && (
        <ul className="search-tags" aria-label="文章标签">
          {post.tags.map(tag => <li key={tag.id}><Link to={`/tags?tag=${encodeURIComponent(tag.name)}`} className="tag-pill">{tag.name}</Link></li>)}
        </ul>
      )}
      {post.snippets.map((snippet, index) => (
        <p className="search-snippet" key={index}>
          {snippet.leading_ellipsis && "…"}
          <HighlightedText parts={snippet.parts} />
          {snippet.trailing_ellipsis && "…"}
        </p>
      ))}
    </article>
  );
}

// HomePage keys this component by the history entry. Draft edits belong only to
// that entry; back/forward restores submitted URL state, never an unrelated draft.
export default function PostsSearch({ children, sidebar }) {
  const [params, setParams] = useSearchParams();
  const query = (params.get("q") || "").trim();
  const rawPage = params.get("page") ?? "1";
  const [draft, setDraft] = useState(query);
  const [expanded, setExpanded] = useState(Boolean(query));
  const inputRef = useRef(null);
  const buttonRef = useRef(null);
  const [attempt, setAttempt] = useState(0);
  const [response, setResponse] = useState(null);
  const requestId = JSON.stringify([query, rawPage, attempt]);
  const current = response?.id === requestId ? response : null;
  const loading = Boolean(query) && !current;

  useEffect(() => {
    if (expanded) inputRef.current?.focus();
  }, [expanded]);

  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    let active = true;
    async function load() {
      try {
        const data = await searchPosts(query, rawPage, controller.signal);
        if (active) setResponse({ id: requestId, data });
      } catch (error) {
        if (active && error.name !== "AbortError") setResponse({ id: requestId, error: true });
      }
    }
    load();
    return () => { active = false; controller.abort(); };
  }, [query, rawPage, requestId]);

  const data = current?.data;
  // Canonicalize invalid/out-of-range pages without adding a history entry.
  useEffect(() => {
    if (!data || String(data.page) === rawPage) return;
    setParams(previous => {
      const next = new URLSearchParams(previous);
      next.set("page", String(data.page));
      return next;
    }, { replace: true });
  }, [data, rawPage, setParams]);

  function clear() {
    setDraft("");
    setParams(previous => {
      const next = new URLSearchParams(previous);
      next.delete("q");
      next.delete("page");
      return next;
    });
  }

  function submit(event) {
    event.preventDefault();
    const submitted = draft.trim();
    if (!submitted) { clear(); return; }
    if (loading && submitted === query) return;
    const next = new URLSearchParams(params);
    next.set("q", submitted);
    next.set("page", "1");
    if (next.toString() === params.toString()) setAttempt(value => value + 1);
    else setParams(next);
  }

  function pageUrl(page) {
    const next = new URLSearchParams(params);
    next.set("page", String(page));
    return `?${next}`;
  }

  return (
    <div className="posts-search">
      <div className="home-layout posts-browse-tools">
        <Link className="posts-tags-link" to="/tags">按标签浏览 ↗</Link>
      <form role="search" aria-label="搜索 Posts"
        className={`posts-search-form${expanded ? " is-expanded" : ""}`} onSubmit={submit}
        onKeyDown={event => {
          if (event.key === "Escape" && !query) {
            event.preventDefault();
            setExpanded(false);
            buttonRef.current?.focus();
          }
        }}>
        <label className="search-label" htmlFor="posts-query">搜索文章标题或正文</label>
        <div className="search-input-row">
          <input ref={inputRef} id="posts-query" className="form-input" type="search" value={draft}
            tabIndex={expanded ? 0 : -1} aria-hidden={!expanded}
            onChange={event => setDraft(event.target.value)} placeholder="搜索文章标题或正文……"
            aria-describedby={query ? "search-help" : undefined} />
          <button ref={buttonRef} type={expanded ? "submit" : "button"}
            aria-label={expanded ? "搜索文章" : "展开文章搜索"}
            aria-expanded={expanded} aria-controls="posts-query"
            onClick={event => {
              if (!expanded) { event.preventDefault(); setExpanded(true); }
            }}
            disabled={loading && draft.trim() === query}>
            <FiSearch aria-hidden="true" />
          </button>
        </div>
      </form>
      </div>
      <div className="home-layout">
        <div className="home-sidebar">{sidebar}</div>
        <div className="home-main">
      {query && <p id="search-help" className="search-help">多个关键词用空格分隔，结果须包含全部关键词。</p>}
      {query ? (
        <section className="search-results" aria-label="文章搜索结果" aria-busy={loading}>
          <div className="search-status-row">
            <p role="status" aria-live="polite">
              {loading ? "正在搜索…" : current?.error ? "搜索失败，请重试。" : `“${query}” · 共 ${data.total} 篇文章`}
            </p>
            <button className="search-text-button" type="button" onClick={clear}>清除搜索</button>
          </div>
          {current?.error && <button className="search-text-button" type="button" onClick={() => setAttempt(value => value + 1)}>重试搜索</button>}
          {data && <>
            {data.total === 0 && <p>没有找到包含全部关键词的文章</p>}
            <div className="post-list">{data.items.map(post => <SearchPost key={post.id} post={post} />)}</div>
            {data.total_pages > 0 && (
              <nav className="search-pagination" aria-label="搜索结果分页">
                {data.page > 1 ? <Link to={pageUrl(data.page - 1)}>上一页</Link> : <span aria-disabled="true">上一页</span>}
                <span>第 {data.page} / {data.total_pages} 页</span>
                {data.page < data.total_pages ? <Link to={pageUrl(data.page + 1)}>下一页</Link> : <span aria-disabled="true">下一页</span>}
              </nav>
            )}
          </>}
        </section>
      ) : children}
        </div>
      </div>
    </div>
  );
}
