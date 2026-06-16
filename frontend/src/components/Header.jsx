// src/components/Header.jsx

import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

function Header() {
  const navigate = useNavigate();
  const [username, setUsername] = useState(() => localStorage.getItem("username"));

  useEffect(() => {
    const sync = () => setUsername(localStorage.getItem("username"));
    window.addEventListener("auth-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("auth-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    window.dispatchEvent(new Event("auth-change"));
    navigate("/");
  }

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

          {username ? (
            <>
              <span className="nav-link nav-user">{username}</span>
              <button onClick={handleLogout} className="nav-link nav-logout-btn">
                退出
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                isActive ? "nav-link nav-link-active" : "nav-link"
              }
            >
              登录
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;