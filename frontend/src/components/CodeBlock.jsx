import { useEffect, useRef, useState } from "react";

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Older browsers and HTTP pages can still support the selection-based copy.
    }
  }

  const activeElement = document.activeElement;
  const selection = window.getSelection();
  const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, i) => selection.getRangeAt(i).cloneRange()) : [];
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.readOnly = true;
  textarea.style.cssText = "position:fixed;top:0;left:0;opacity:0;font-size:16px;";
  document.body.append(textarea);
  try {
    textarea.focus({ preventScroll: true });
    textarea.select();
    if (!document.execCommand("copy")) throw new Error("Copy unavailable");
  } finally {
    textarea.remove();
    activeElement?.focus({ preventScroll: true });
    if (selection) {
      selection.removeAllRanges();
      ranges.forEach(range => selection.addRange(range));
    }
  }
}

export default function CodeBlock({ text, language, children }) {
  const [status, setStatus] = useState("idle");
  const timer = useRef(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      window.clearTimeout(timer.current);
    };
  }, []);

  async function handleCopy() {
    if (status === "copying") return;
    window.clearTimeout(timer.current);
    setStatus("copying");
    let nextStatus;
    try {
      await copyText(text);
      nextStatus = "copied";
    } catch {
      nextStatus = "failed";
    }
    if (!mounted.current) return;
    setStatus(nextStatus);
    timer.current = window.setTimeout(() => setStatus("idle"), nextStatus === "failed" ? 4000 : 2000);
  }

  return (
    <div className="markdown-code-block">
      <div className="markdown-code-toolbar">
        <span className="markdown-code-language">{language || "代码"}</span>
        <button type="button" className="markdown-code-copy" onClick={handleCopy} aria-disabled={status === "copying"} aria-label="复制代码">
          {status === "copied" ? "已复制" : status === "copying" ? "复制中…" : "复制"}
        </button>
      </div>
      <pre>{children}</pre>
      <div className={`markdown-code-status${status === "failed" ? " markdown-code-status-error" : ""}`} role="status" aria-live="polite">
        {status === "failed" ? "复制失败，请手动选择代码复制。" : status === "copied" ? "代码已复制" : ""}
      </div>
    </div>
  );
}
