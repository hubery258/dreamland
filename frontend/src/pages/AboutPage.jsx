// src/pages/AboutPage.jsx

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import PageTitle from "../components/PageTitle";
import { getAbout } from "../api/client";

function AboutPage() {
  const [aboutData, setAboutData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAbout() {
      try {
        setLoading(true);
        setError("");

        const data = await getAbout();
        setAboutData(data);
      } catch (err) {
        console.error("获取 About 内容失败:", err);
        setError("About 页面加载失败，请检查后端是否启动。");
      } finally {
        setLoading(false);
      }
    }

    fetchAbout();
  }, []);

  if (loading) {
    return (
      <section className="page-section">
        <div className="content-width">
          <p className="muted-text">Loading about...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page-section">
        <div className="content-width">
          <p className="error-text">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="content-width">
        <PageTitle eyebrow="Written by hubery" title={aboutData?.about_title || "About"} />

        <article className="markdown-body">
          <ReactMarkdown>
            {aboutData?.about_content || "暂无内容。"}
          </ReactMarkdown>
        </article>
      </div>
    </section>
  );
}

export default AboutPage;