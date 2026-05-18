// src/components/Header.jsx

import { Link, NavLink } from "react-router-dom";

function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        {/* 左侧站点名，点击回到首页 */}
        <Link to="/" className="site-logo">
          Dreamland
        </Link>

        {/* 右侧导航 */}
        <nav className="site-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? "nav-link nav-link-active" : "nav-link"
            }
          >
            Posts
          </NavLink>

          <NavLink
            to="/tags"
            className={({ isActive }) =>
              isActive ? "nav-link nav-link-active" : "nav-link"
            }
          >
            Tags
          </NavLink>

          <NavLink
            to="/about"
            className={({ isActive }) =>
              isActive ? "nav-link nav-link-active" : "nav-link"
            }
          >
            About
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default Header;