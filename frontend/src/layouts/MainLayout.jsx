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
    </div>
  );
}

export default MainLayout;