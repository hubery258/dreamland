export function formatNowDate(value) {
  if (!value) return "";
  // Existing article timestamps are naive UTC; Now timestamps carry an offset.
  const normalized = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`;
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai", year: "numeric", month: "long", day: "numeric",
  }).format(new Date(normalized));
}
