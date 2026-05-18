// src/App.jsx

import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

// 下面这些页面文件我们这一步先创建骨架版本
import HomePage from "./pages/HomePage";
import PostDetailPage from "./pages/PostDetailPage";
import TagsPage from "./pages/TagsPage";
import AboutPage from "./pages/AboutPage";
import NewPostPage from "./pages/NewPostPage";

function App() {
  return (
    <Routes>
      {/* 所有主要页面都共用同一个布局 */}
      <Route path="/" element={<MainLayout />}>
        {/* 首页：文章列表 */}
        <Route index element={<HomePage />} />

        {/* 文章详情页 */}
        <Route path="posts/:slug" element={<PostDetailPage />} />

        {/* tags 页面 */}
        <Route path="tags" element={<TagsPage />} />

        {/* about 页面 */}
        <Route path="about" element={<AboutPage />} />

        {/* 发帖页 */}
        <Route path="admin/new" element={<NewPostPage />} />
      </Route>
    </Routes>
  );
}

export default App;