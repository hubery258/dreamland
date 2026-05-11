import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import PostList from './components/PostList'
import PostDetail from './components/PostDetail'
import About from './components/About'

// App root component with client-side routing.
// Routes:
//  - `/` shows the list of posts
//  - `/posts/:id` shows a single post detail
// Top-level application component with client-side routing.
// Routes defined here map URL paths to page components.
export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<PostList />} />
          <Route path="/posts/:id" element={<PostDetail />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
      <footer className="container">
        <span>© 2026 MyBlog</span>
      </footer>
    </BrowserRouter>
  )
}
