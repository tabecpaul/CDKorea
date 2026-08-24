export function formatAnalyticsStartDate(value: Date | string) {
  return new Date(value).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });
}
