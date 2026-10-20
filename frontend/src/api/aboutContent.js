// Old installations may still contain the original setup placeholder.
export function aboutBody(content) {
  const value = content ?? "";
  const placeholders = [
    "这里写你的自我介绍。",
    "这里写你的自我介绍。你以后可以从接口里更新。",
  ];
  return placeholders.includes(value.trim()) ? "" : value;
}
