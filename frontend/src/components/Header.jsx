import React from 'react'
import { Link } from 'react-router-dom'

// Header uses Links from react-router-dom so navigation is client-side.
export default function Header() {
  return (
    <header className="nav-container">
      <div className="nav">
        <h1 className="nav-title"><Link to="/">MyBlog</Link></h1>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><a href="#">About</a></li>
          <li><a href="#">Archives</a></li>
        </ul>
      </div>
    </header>
  )
}
