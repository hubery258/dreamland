import React from 'react'

// Simple About page. For now it's static text imported from the original
// site's content; later we can load this from a Markdown file or CMS.
export default function About() {
  return (
    <section className="post">
      <h1 className="post-title">About</h1>
      <p>
        这是关于页面示例。你可以把这里替换为你的个人简介、联系方式或
        任何想在关于页展示的静态内容。
      </p>
      <p>
        如果你希望我把原站的关于页内容导入到这里，我可以把
        `hubery258.github.io/_pages/about.md`（或类似文件）解析并渲染。
      </p>
    </section>
  )
}
