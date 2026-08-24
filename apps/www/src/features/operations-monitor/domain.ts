export const operationsIssueDefinitions = {
  payment_overdue: { label: "입금기한 초과", severity: "warning", filter: "overdue" },
  payment_email_failed: { label: "결제·환불 이메일 실패", severity: "critical", filter: "email_failed" },
  callback_email_failed: { label: "콜백·일정 이메일 실패", severity: "critical", filter: "email_failed" },
  evidence_needed: { label: "증빙 처리 대기", severity: "warning", filter: "evidence_needed" },
  refund_pending: { label: "환불 처리 대기", severity: "critical", filter: "refund_pending" },
  lead_email_delayed: { label: "리드 이메일 작업 지연", severity: "critical", filter: null },
  callback_reminder_delayed: { label: "콜백 알림 작업 지연", severity: "critical", filter: null },
  lead_cron_stale: { label: "리드 이메일 Cron 이상", severity: "critical", filter: null },
  callback_cron_stale: { label: "콜백 알림 Cron 이상", severity: "critical", filter: null },
  monitor_cron_stale: { label: "운영 모니터링 Cron 이상", severity: "critical", filter: null },
} as const;

export type OperationsIssueKey = keyof typeof operationsIssueDefinitions;
export type OperationsIssue = { key: OperationsIssueKey; count: number };
export type JobLastSuccess = { jobName: string; completedAt: string | null };
export type OperationsSnapshot = { checkedAt: string; issues: OperationsIssue[]; issueCount: number; lastSuccess: JobLastSuccess[] };

export const monitoredJobNames = ["lead-emails", "callback-reminders", "operations-monitor"] as const;
export type MonitoredJobName = (typeof monitoredJobNames)[number];
export type SystemJobName = MonitoredJobName | "marketing-import";
