// src/layouts/MainLayout.jsx

import { Outlet } from "react-router-dom";
import Header from "../components/Header";

function MainLayout() {
  return (
    <div className="site-shell">
      {/* 顶部导航栏 */}
      <Header />

      {/* 主内容区域 */}
      <main className="site-main">
        {/* Outlet 表示这里渲染子路由页面 */}
        <Outlet />
      </main>

      {/* 页脚：放备案号 */}
      <footer className="site-footer">
        <div className="site-footer-inner">
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noreferrer"
            className="beian-link"
          >
            蜀ICP备2026026434号
          </a>
        </div>
      </footer>
    </div>
  );
}

export default MainLayout;