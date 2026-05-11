import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import PostList from './components/PostList'
import PostDetail from './components/PostDetail'

// App root component with client-side routing.
// Routes:
//  - `/` shows the list of posts
//  - `/posts/:id` shows a single post detail
export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<PostList />} />
          <Route path="/posts/:id" element={<PostDetail />} />
        </Routes>
      </main>
      <footer className="container">
        <span>© 2026 MyBlog</span>
      </footer>
    </BrowserRouter>
  )
}
