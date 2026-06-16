// src/api/client.js

// Vite 的环境变量必须以 VITE_ 开头
// 开发时默认指向本地 FastAPI
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

/**
 * 通用请求函数
 * 以后所有 API 调用都从这里走
 */
async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,

    // 注意：headers 要放在 ...options 后面再单独合并
    // 这样就不会被 options.headers 整体覆盖掉
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  // 如果接口返回失败，就抛出错误
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "请求失败");
  }

  return response.json();
}

/**
 * 获取文章列表
 */
export function getPosts() {
  return request("/posts/");
}

/**
 * 获取单篇文章
 */
export function getPostBySlug(slug) {
  return request(`/posts/${encodeURIComponent(slug)}`);
}

/**
 * 创建文章
 */
export function createPost(data, adminSecret) {
  return request("/posts/", {
    method: "POST",
    headers: {
      "X-Admin-Secret": adminSecret,
    },
    body: JSON.stringify(data),
  });
}

/**
 * 获取所有标签
 */
export function getTags() {
  return request("/tags/");
}

/**
 * 获取某个标签下的文章
 */
export function getPostsByTag(tagName) {
  return request(`/tags/${encodeURIComponent(tagName)}`);
}

/**
 * 获取 About 内容
 */
export function getAbout() {
  return request("/site/about");
}

/**
 * 更新 About 内容
 */
export function updateAbout(data) {
  return request("/site/about", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}