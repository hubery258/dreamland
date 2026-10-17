import { request } from "./client";

export const getNow = () => request("/site/now");
export const saveNow = (data, secret) => request("/site/now", {
  method: "PUT",
  headers: { "X-Admin-Secret": secret },
  body: JSON.stringify(data),
});
