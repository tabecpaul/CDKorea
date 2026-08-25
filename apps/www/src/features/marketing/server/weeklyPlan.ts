import { marketingChannels, type MarketingChannel } from "../domain";

const SLUG = /^[a-z0-9][a-z0-9-]{1,158}[a-z0-9]$/;
const CAMPAIGN_KEY = /^[a-z0-9][a-z0-9_-]{1,118}[a-z0-9]$/;
const statuses = ["approved", "published", "on_hold"] as const;

export type WeeklyPlanStatus = (typeof statuses)[number];
export type WeeklyPlanSchedule = { channel: MarketingChannel; scheduledAt: string };
export type WeeklyPlanItem = {
  slug: string;
  title: string;
  campaignKey: string;
  schedules: WeeklyPlanSchedule[];
  status: WeeklyPlanStatus;
  note?: string;
};
export type WeeklyContentPlan = { schemaVersion: 1; weekStart: string; items: WeeklyPlanItem[] };

export class WeeklyPlanError extends Error {
  constructor(public code: string, public path: string) { super(`${code}:${path}`); }
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new WeeklyPlanError("EXPECTED_OBJECT", path);
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, allowed: readonly string[], path: string) {
  for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new WeeklyPlanError("UNKNOWN_FIELD", `${path}.${key}`);
}

function text(value: unknown, path: string, max: number) {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new WeeklyPlanError("INVALID_STRING", path);
  return value.trim();
}

function calendarDate(value: unknown, path: string) {
  const parsed = text(value, path, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed) || Number.isNaN(Date.parse(`${parsed}T00:00:00Z`))) throw new WeeklyPlanError("INVALID_DATE", path);
  return parsed;
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function parseWeeklyContentPlan(input: unknown): WeeklyContentPlan {
  const root = record(input, "$weeklyPlan");
  exactKeys(root, ["schemaVersion", "weekStart", "items"], "$weeklyPlan");
  if (root.schemaVersion !== 1) throw new WeeklyPlanError("UNSUPPORTED_SCHEMA", "$weeklyPlan.schemaVersion");
  const weekStart = calendarDate(root.weekStart, "$weeklyPlan.weekStart");
  if (new Date(`${weekStart}T00:00:00Z`).getUTCDay() !== 1) throw new WeeklyPlanError("WEEK_START_NOT_MONDAY", "$weeklyPlan.weekStart");
  if (!Array.isArray(root.items) || root.items.length < 1 || root.items.length > 50) throw new WeeklyPlanError("INVALID_ITEMS", "$weeklyPlan.items");
  const seenSlugs = new Set<string>();
  const items = root.items.map((value, itemIndex): WeeklyPlanItem => {
    const path = `$weeklyPlan.items[${itemIndex}]`;
    const item = record(value, path);
    exactKeys(item, ["slug", "title", "campaignKey", "schedules", "status", "note"], path);
    const slug = text(item.slug, `${path}.slug`, 160);
    if (!SLUG.test(slug) || seenSlugs.has(slug)) throw new WeeklyPlanError(seenSlugs.has(slug) ? "DUPLICATE_SLUG" : "INVALID_SLUG", `${path}.slug`);
    seenSlugs.add(slug);
    const campaignKey = text(item.campaignKey, `${path}.campaignKey`, 120);
    if (!CAMPAIGN_KEY.test(campaignKey)) throw new WeeklyPlanError("INVALID_CAMPAIGN_KEY", `${path}.campaignKey`);
    const status = text(item.status, `${path}.status`, 16);
    if (!statuses.includes(status as WeeklyPlanStatus)) throw new WeeklyPlanError("INVALID_STATUS", `${path}.status`);
    if (!Array.isArray(item.schedules) || item.schedules.length < 1 || item.schedules.length > marketingChannels.length) throw new WeeklyPlanError("INVALID_SCHEDULES", `${path}.schedules`);
    const seenChannels = new Set<string>();
    const schedules = item.schedules.map((scheduleValue, scheduleIndex): WeeklyPlanSchedule => {
      const schedulePath = `${path}.schedules[${scheduleIndex}]`;
      const schedule = record(scheduleValue, schedulePath);
      exactKeys(schedule, ["channel", "scheduledAt"], schedulePath);
      const channel = text(schedule.channel, `${schedulePath}.channel`, 24);
      if (!marketingChannels.includes(channel as MarketingChannel) || seenChannels.has(channel)) throw new WeeklyPlanError(seenChannels.has(channel) ? "DUPLICATE_CHANNEL" : "INVALID_CHANNEL", `${schedulePath}.channel`);
      seenChannels.add(channel);
      const scheduledAt = text(schedule.scheduledAt, `${schedulePath}.scheduledAt`, 40);
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+09:00$/.test(scheduledAt) || Number.isNaN(Date.parse(scheduledAt))) throw new WeeklyPlanError("INVALID_KST_TIME", `${schedulePath}.scheduledAt`);
      const scheduledDate = scheduledAt.slice(0, 10);
      if (scheduledDate < weekStart || scheduledDate >= addDays(weekStart, 7)) throw new WeeklyPlanError("SCHEDULE_OUTSIDE_WEEK", `${schedulePath}.scheduledAt`);
      return { channel: channel as MarketingChannel, scheduledAt };
    });
    const note = item.note === undefined ? undefined : text(item.note, `${path}.note`, 500);
    return { slug, title: text(item.title, `${path}.title`, 240), campaignKey, schedules, status: status as WeeklyPlanStatus, ...(note ? { note } : {}) };
  });
  return { schemaVersion: 1, weekStart, items };
}

export function nextKstWeekStart(now = new Date()) {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const date = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()));
  const daysUntilMonday = (8 - date.getUTCDay()) % 7 || 7;
  date.setUTCDate(date.getUTCDate() + daysUntilMonday);
  return date.toISOString().slice(0, 10);
}
