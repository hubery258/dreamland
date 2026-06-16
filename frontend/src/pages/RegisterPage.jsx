// src/pages/RegisterPage.jsx

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register, login } from "../api/client";
import PageTitle from "../components/PageTitle";

function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("用户名和密码不能为空");
      return;
    }
    if (password !== confirmPassword) {
      setError("两次密码不一致");
      return;
    }
    if (password.length < 4) {
      setError("密码至少 4 位");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await register(username.trim(), password);
      // 注册成功自动登录
      const data = await login(username.trim(), password);
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("username", data.username);
      navigate("/");
    } catch (err) {
      setError("注册失败：" + (err.message || "请重试"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page-section">
      <div className="narrow-content-width">
        <PageTitle title="Register" />
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <p className="error-text">{error}</p>}
          <label className="auth-label">
            用户名
            <input
              className="auth-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="2-50 个字符"
            />
          </label>
          <label className="auth-label">
            密码
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 4 位"
            />
          </label>
          <label className="auth-label">
            确认密码
            <input
              className="auth-input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入密码"
            />
          </label>
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "注册中..." : "注册"}
          </button>
          <p className="auth-switch">
            已有账号？
            <Link to="/login">去登录</Link>
          </p>
        </form>
      </div>
    </section>
  );
}

export default RegisterPage;
