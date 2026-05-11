import React from 'react'
import { Link } from 'react-router-dom'

// Header uses Links from react-router-dom so navigation is client-side.
// Comments below explain structure for newcomers:
// - The header has a title (left) and navigation links (right on wide screens).
// - Use `Link` (react-router) to avoid full-page reloads when navigating.
// - If you click a Link and the page doesn't update, ensure the
//   <BrowserRouter> is correctly set up in `App.jsx`.
export default function Header() {
  return (
    <header className="nav-container">
      <div className="nav">
        {/* Site title: clicking goes to home */}
        <h1 className="nav-title"><Link to="/">MyBlog</Link></h1>

        {/* Primary navigation. Replace or extend items as needed. */}
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About</Link></li>
          <li><a href="#">Archives</a></li>
        </ul>
      </div>
    </header>
  )
}
