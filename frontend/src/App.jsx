// src/App.jsx

import { Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

import AboutPage from "./pages/AboutPage";
import AboutAdminPage from "./pages/AboutAdminPage";
import FriendsPage from "./pages/FriendsPage";
import GalleryPage from "./pages/GalleryPage";
import HomePage from "./pages/HomePage";
import GalleryAdminPage from "./pages/GalleryAdminPage";
import FriendsAdminPage from "./pages/FriendsAdminPage";
import NewPostPage from "./pages/NewPostPage";
import PostDetailPage from "./pages/PostDetailPage";
import TagsPage from "./pages/TagsPage";
import NowPage from "./pages/NowPage";
import NowAdminPage from "./pages/NowAdminPage";

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

        <Route path="about" element={<AboutPage />} />
        <Route path="admin/about" element={<AboutAdminPage />} />
        <Route path="now" element={<NowPage />} />
        <Route path="admin/now" element={<NowAdminPage />} />

        <Route path="admin/new" element={<NewPostPage />} />
        <Route path="admin/gallery" element={<GalleryAdminPage />} />
        <Route path="admin/friends" element={<FriendsAdminPage />} />
        <Route path="admin/edit/:slug" element={<NewPostPage />} />
      </Route>
    </Routes>
  );
}

export default App;
