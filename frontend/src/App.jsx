// src/App.jsx

import { Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

import AboutPage from "./pages/AboutPage";
import FriendsPage from "./pages/FriendsPage";
import GalleryPage from "./pages/GalleryPage";
import HomePage from "./pages/HomePage";
import GalleryAdminPage from "./pages/GalleryAdminPage";
import NewPostPage from "./pages/NewPostPage";
import PostDetailPage from "./pages/PostDetailPage";
import TagsPage from "./pages/TagsPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="posts/:slug" element={<PostDetailPage />} />
        <Route path="tags" element={<TagsPage />} />
        <Route path="friends" element={<FriendsPage />} />
        <Route path="gallery" element={<GalleryPage />} />
        <Route path="gallery/:albumId" element={<GalleryPage />} />

        {/* about 页面先保留路由，但不在导航显示 */}
        <Route path="about" element={<AboutPage />} />

        <Route path="admin/new" element={<NewPostPage />} />
        <Route path="admin/gallery" element={<GalleryAdminPage />} />
        <Route path="admin/edit/:slug" element={<NewPostPage />} />
      </Route>
    </Routes>
  );
}

export default App;