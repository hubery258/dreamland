// src/api/client.js

// 后端 API 基础地址
// 开发环境下，我们的 FastAPI 跑在 8000 端口
const BASE_URL = "http://127.0.0.1:8000";

/**
 * 通用请求函数
 * 以后所有 API 调用都从这里走
 */
async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
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
export function createPost(data) {
  return request("/posts/", {
    method: "POST",
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