// src/pages/AboutPage.jsx

import { useEffect, useState } from "react";
import MarkdownContent from "../components/MarkdownContent";
import PageTitle from "../components/PageTitle";
import { getAbout } from "../api/client";
import { aboutBody } from "../api/aboutContent";
import "../styles/about.css";

function AboutPage() {
  const [aboutData, setAboutData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function fetchAbout() {
      try {
        setLoading(true);
        setError("");

        const data = await getAbout();
        if (active) setAboutData(data);
      } catch (err) {
        console.error("获取 About 内容失败:", err);
        if (active) setError("About 页面暂时无法加载，请稍后刷新重试。");
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchAbout();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <section className="page-section">
        <div className="content-width">
          <p className="muted-text" role="status">正在加载 About…</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page-section">
        <div className="content-width">
          <p className="error-text" role="alert">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="content-width">
        <PageTitle title={aboutData?.about_title || "About"} />

        <article className="markdown-body about-body">
          <MarkdownContent>
            {aboutBody(aboutData?.about_content)}
          </MarkdownContent>
        </article>
      </div>
    </section>
  );
}

export default AboutPage;
