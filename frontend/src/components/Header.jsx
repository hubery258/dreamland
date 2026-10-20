// src/components/Header.jsx

import { Link, NavLink } from "react-router-dom";

function navClassName({ isActive }) {
  return isActive ? "nav-link nav-link-active" : "nav-link";
}

function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="site-logo">
          Dreamland
        </Link>

        <nav className="site-nav" aria-label="Main navigation">
          <NavLink to="/" end className={navClassName}>
            Posts
          </NavLink>
          <NavLink to="/now" className={navClassName}>
            Now
          </NavLink>
          <NavLink to="/about" className={navClassName}>
            About
          </NavLink>
          <a
            href="https://note.ramenboy.cc"
            className="nav-link"
            target="_blank"
            rel="noreferrer"
          >
            Notebook
          </a>
          <NavLink to="/gallery" className={navClassName}>
            Gallery
          </NavLink>
          <NavLink to="/friends" className={navClassName}>
            Friends
          </NavLink>
          <a
            href="https://www.travellings.cn/go.html"
            className="nav-link"
            target="_blank"
            rel="noreferrer"
          >
            Travelling
          </a>
        </nav>
      </div>
    </header>
  );
}

export default Header;
