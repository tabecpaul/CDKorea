const KOREA_TIME_ZONE = "Asia/Seoul";

export function formatKoreaAdminDateTime(value: Date) {
  return {
    date: new Intl.DateTimeFormat("ko-KR", {
      timeZone: KOREA_TIME_ZONE,
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).format(value),
    time: new Intl.DateTimeFormat("ko-KR", {
      timeZone: KOREA_TIME_ZONE,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(value),
  };
}
