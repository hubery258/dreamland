import { request } from "./client";

export function searchPosts(query, page, signal) {
  const params = new URLSearchParams({ q: query, page });
  return request(`/posts/search/?${params}`, { signal });
}
