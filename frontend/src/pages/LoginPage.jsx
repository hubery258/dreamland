// src/pages/LoginPage.jsx

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api/client";
import PageTitle from "../components/PageTitle";

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("用户名和密码不能为空");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await login(username.trim(), password);
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("username", data.username);
      navigate("/");
    } catch (err) {
      setError("登录失败：" + (err.message || "用户名或密码错误"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page-section">
      <div className="narrow-content-width">
        <PageTitle title="Login" />
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <p className="error-text">{error}</p>}
          <label className="auth-label">
            用户名
            <input
              className="auth-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="输入用户名"
            />
          </label>
          <label className="auth-label">
            密码
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码"
            />
          </label>
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "登录中..." : "登录"}
          </button>
          <p className="auth-switch">
            还没有账号？
            <Link to="/register">去注册</Link>
          </p>
        </form>
      </div>
    </section>
  );
}

export default LoginPage;
