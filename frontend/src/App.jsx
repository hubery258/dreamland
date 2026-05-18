// src/App.jsx

import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

import HomePage from "./pages/HomePage";
import PostDetailPage from "./pages/PostDetailPage";
import TagsPage from "./pages/TagsPage";
import AboutPage from "./pages/AboutPage";
import NewPostPage from "./pages/NewPostPage";
import FriendsPage from "./pages/FriendsPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="posts/:slug" element={<PostDetailPage />} />
        <Route path="tags" element={<TagsPage />} />
        <Route path="friends" element={<FriendsPage />} />

        {/* about 页面先保留路由，但不在导航显示 */}
        <Route path="about" element={<AboutPage />} />

        <Route path="admin/new" element={<NewPostPage />} />
      </Route>
    </Routes>
  );
}

export default App;