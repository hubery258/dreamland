// src/components/PageTitle.jsx

function PageTitle({ eyebrow, title, centered = true }) {
  return (
    <div className={centered ? "page-title page-title-centered" : "page-title"}>
      {/* eyebrow 指标题上方那行小字，比如 “Written by hubery” */}
      {eyebrow && <p className="page-eyebrow">{eyebrow}</p>}

      <h1 className="page-heading">{title}</h1>

      {/* 标题下方短横线 */}
      <div className="page-title-underline" />
    </div>
  );
}

export default PageTitle;