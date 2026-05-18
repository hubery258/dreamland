// src/components/Header.jsx

import { Link, NavLink } from "react-router-dom";

function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="site-logo">
          Dreamland
        </Link>

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
            to="/friends"
            className={({ isActive }) =>
              isActive ? "nav-link nav-link-active" : "nav-link"
            }
          >
            Friends
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default Header;