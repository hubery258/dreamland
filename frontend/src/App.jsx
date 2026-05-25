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

/* React Router 是一个第三方库，用来管理页面跳转，把不同url映射到不同组件
在Routes组件下我们把初始path定为/然后基础渲染是HomePage组件
其余就是我们对应的path长什么样我们就用Route组件渲染被选中的element组件而已
所以如果以后还要加页面，就是在这里加
特别地：:slug → 动态路由参数，占位符，我们可以用useParams() → 在组件里获取实际的值*/