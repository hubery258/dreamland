// src/main.jsx

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

// 引入我们自己的全局样式
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* BrowserRouter 用来支持前端页面路由 */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);