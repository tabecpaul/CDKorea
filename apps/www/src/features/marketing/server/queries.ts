import "server-only";

import { and, asc, desc, eq, gte, inArray, lt, or, sql } from "drizzle-orm";
import {
  db,
  marketingApprovals,
  marketingChannelSchedules,
  marketingConnections,
  marketingContentAssets,
  marketingContents,
  marketingContentVersions,
} from "@newland/db";
import { marketingContentStatuses, type MarketingContentStatus } from "../domain";

const PAGE_SIZE = 30;
const KST_OFFSET = "+09:00";

export type QueryResult<T> = { data: T; error: null } | { data: null; error: string };
export type MarketingCalendarView = "week" | "month";
export type MarketingListCursor = { updatedAt: string; id: number };

export async function safely<T>(query: () => Promise<T>): Promise<QueryResult<T>> {
  try {
    return { data: await query(), error: null };
  } catch (error) {
    console.error("Marketing dashboard query failed", error);
    return { data: null, error: "운영 데이터 연결을 확인해 주세요." };
  }
}

function calendarDate(value?: string) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addCalendarDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function marketingCalendarRange(view: MarketingCalendarView, anchorValue?: string) {
  const anchor = calendarDate(anchorValue);
  const calendar = new Date(`${anchor}T00:00:00Z`);
  if (view === "month") {
    const startDate = `${calendar.getUTCFullYear()}-${String(calendar.getUTCMonth() + 1).padStart(2, "0")}-01`;
    const nextMonth = new Date(Date.UTC(calendar.getUTCFullYear(), calendar.getUTCMonth() + 1, 1));
    const endDate = nextMonth.toISOString().slice(0, 10);
    return { anchor, start: new Date(`${startDate}T00:00:00${KST_OFFSET}`), end: new Date(`${endDate}T00:00:00${KST_OFFSET}`) };
  }
  const mondayOffset = (calendar.getUTCDay() + 6) % 7;
  const startDate = addCalendarDays(anchor, -mondayOffset);
  const endDate = addCalendarDays(startDate, 7);
  return { anchor, start: new Date(`${startDate}T00:00:00${KST_OFFSET}`), end: new Date(`${endDate}T00:00:00${KST_OFFSET}`) };
}

function parseCursor(value?: string) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as MarketingListCursor;
    const updatedAt = new Date(parsed.updatedAt);
    return Number.isSafeInteger(parsed.id) && parsed.id > 0 && !Number.isNaN(updatedAt.getTime())
      ? { id: parsed.id, updatedAt }
      : null;
  } catch {
    return null;
  }
}

function encodeCursor(value: MarketingListCursor) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

export async function getMarketingSummary() {
  const range = marketingCalendarRange("week");
  const [contentRows, scheduleRows] = await Promise.all([
    db.select({ status: marketingContentVersions.status, count: sql<number>`count(*)::int` })
      .from(marketingContents)
      .leftJoin(marketingContentVersions, eq(marketingContents.currentVersionId, marketingContentVersions.id))
      .groupBy(marketingContentVersions.status),
    db.select({ status: marketingChannelSchedules.status, count: sql<number>`count(*)::int` })
      .from(marketingChannelSchedules)
      .where(and(gte(marketingChannelSchedules.scheduledAt, range.start), lt(marketingChannelSchedules.scheduledAt, range.end)))
      .groupBy(marketingChannelSchedules.status),
  ]);
  const content = Object.fromEntries(contentRows.map((row) => [row.status ?? "proposal", row.count]));
  const schedules = Object.fromEntries(scheduleRows.map((row) => [row.status, row.count]));
  return {
    reviewPending: content.review_pending ?? 0,
    revisionRequested: content.revision_requested ?? 0,
    approved: content.approved ?? 0,
    scheduled: schedules.scheduled ?? 0,
    actionRequired: (schedules.action_required ?? 0) + (schedules.publish_failed ?? 0),
    published: (schedules.published ?? 0) + (schedules.manual_published ?? 0),
  };
}

export async function getMarketingCalendar(view: MarketingCalendarView, anchor?: string) {
  const range = marketingCalendarRange(view, anchor);
  const items = await db.select({
    id: marketingChannelSchedules.id,
    contentId: marketingChannelSchedules.contentId,
    title: marketingContents.title,
    channel: marketingChannelSchedules.channel,
    status: marketingChannelSchedules.status,
    mode: marketingChannelSchedules.mode,
    scheduledAt: marketingChannelSchedules.scheduledAt,
  }).from(marketingChannelSchedules)
    .innerJoin(marketingContents, eq(marketingChannelSchedules.contentId, marketingContents.id))
    .where(and(gte(marketingChannelSchedules.scheduledAt, range.start), lt(marketingChannelSchedules.scheduledAt, range.end)))
    .orderBy(asc(marketingChannelSchedules.scheduledAt));
  return { ...range, items };
}

export async function getImportedSchedulesForWeek(weekStart: string) {
  const start = new Date(`${weekStart}T00:00:00${KST_OFFSET}`);
  const endDate = addCalendarDays(weekStart, 7);
  const end = new Date(`${endDate}T00:00:00${KST_OFFSET}`);
  const rows = await db.select({
    packageId: marketingContentVersions.sourcePackageId,
    slug: marketingContents.slug,
    campaignKey: marketingContents.campaignKey,
    channel: marketingChannelSchedules.channel,
    scheduledAt: marketingChannelSchedules.scheduledAt,
  }).from(marketingChannelSchedules)
    .innerJoin(marketingContents, eq(marketingChannelSchedules.contentId, marketingContents.id))
    .innerJoin(marketingContentVersions, eq(marketingContents.currentVersionId, marketingContentVersions.id))
    .where(and(
      eq(marketingChannelSchedules.versionId, marketingContentVersions.id),
      gte(marketingChannelSchedules.scheduledAt, start),
      lt(marketingChannelSchedules.scheduledAt, end),
    ));
  return rows.map((row) => ({ ...row, scheduledAt: row.scheduledAt.toISOString() }));
}

export async function listMarketingContents(statusValue?: string, cursorValue?: string) {
  const status = marketingContentStatuses.includes(statusValue as MarketingContentStatus)
    ? statusValue as MarketingContentStatus
    : undefined;
  const cursor = parseCursor(cursorValue);
  const conditions = [];
  if (status) conditions.push(eq(marketingContentVersions.status, status));
  if (cursor) conditions.push(or(
    lt(marketingContents.updatedAt, cursor.updatedAt),
    and(eq(marketingContents.updatedAt, cursor.updatedAt), lt(marketingContents.id, cursor.id)),
  ));
  const rows = await db.select({
    id: marketingContents.id,
    title: marketingContents.title,
    campaignKey: marketingContents.campaignKey,
    ctaKind: marketingContents.ctaKind,
    naverCategory: marketingContents.naverCategory,
    updatedAt: marketingContents.updatedAt,
    version: marketingContentVersions.version,
    status: marketingContentVersions.status,
  }).from(marketingContents)
    .leftJoin(marketingContentVersions, eq(marketingContents.currentVersionId, marketingContentVersions.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(marketingContents.updatedAt), desc(marketingContents.id))
    .limit(PAGE_SIZE + 1);
  const items = rows.slice(0, PAGE_SIZE);
  const last = items.at(-1);
  return {
    items,
    nextCursor: rows.length > PAGE_SIZE && last
      ? encodeCursor({ updatedAt: last.updatedAt.toISOString(), id: last.id })
      : null,
  };
}

export async function listMarketingConnections() {
  return db.select({
    id: marketingConnections.id,
    channel: marketingConnections.channel,
    accountName: marketingConnections.accountName,
    status: marketingConnections.status,
    permissions: marketingConnections.permissions,
    tokenExpiresAt: marketingConnections.tokenExpiresAt,
    checkedAt: marketingConnections.checkedAt,
  }).from(marketingConnections).orderBy(asc(marketingConnections.channel));
}

export async function getMarketingContent(id: number) {
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  const content = await db.select().from(marketingContents).where(eq(marketingContents.id, id)).limit(1);
  if (!content[0]) return null;
  const [versions, schedules] = await Promise.all([
    db.select({
      id: marketingContentVersions.id,
      contentId: marketingContentVersions.contentId,
      version: marketingContentVersions.version,
      status: marketingContentVersions.status,
      naverBody: marketingContentVersions.naverBody,
      metaCaption: marketingContentVersions.metaCaption,
      threadsPosts: marketingContentVersions.threadsPosts,
      driveFolderId: marketingContentVersions.driveFolderId,
      canvaDesignUrl: marketingContentVersions.canvaDesignUrl,
      approvedSnapshotHash: marketingContentVersions.approvedSnapshotHash,
      createdBy: marketingContentVersions.createdBy,
      revisionNote: marketingContentVersions.revisionNote,
      createdAt: marketingContentVersions.createdAt,
    }).from(marketingContentVersions).where(eq(marketingContentVersions.contentId, id)).orderBy(desc(marketingContentVersions.version)),
    db.select().from(marketingChannelSchedules).where(eq(marketingChannelSchedules.contentId, id)).orderBy(asc(marketingChannelSchedules.scheduledAt)),
  ]);
  const versionIds = versions.map((version) => version.id);
  const [assets, approvals] = versionIds.length ? await Promise.all([
    db.select().from(marketingContentAssets).where(inArray(marketingContentAssets.versionId, versionIds)).orderBy(asc(marketingContentAssets.versionId), asc(marketingContentAssets.position)),
    db.select().from(marketingApprovals).where(inArray(marketingApprovals.versionId, versionIds)).orderBy(desc(marketingApprovals.createdAt)),
  ]) : [[], []];
  return { content: content[0], versions, assets, schedules, approvals };
}
