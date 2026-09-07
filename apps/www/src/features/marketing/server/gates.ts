import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";
import { db, marketingAuditLogs, marketingCanonicalReadbacks, marketingContentVersions, marketingContents } from "@newland/db";
import { canonicalReadbackResult } from "../gates";
import type { MarketingGateRequest } from "../gateRequest";

const canonicalHosts = new Set(["careerdirect.kr", "www.careerdirect.kr"]);

export type MarketingGateErrorCode = "CONTENT_NOT_FOUND" | "CONTENT_VERSION_NOT_FOUND" | "CANONICAL_URL_NOT_ALLOWED" | "CANONICAL_READBACK_UNAVAILABLE";

export class MarketingGateError extends Error {
  constructor(public code: MarketingGateErrorCode) { super(code); }
}

async function currentVersion(contentId: number) {
  const [content] = await db.select().from(marketingContents).where(eq(marketingContents.id, contentId)).limit(1);
  if (!content) throw new MarketingGateError("CONTENT_NOT_FOUND");
  if (!content.currentVersionId) throw new MarketingGateError("CONTENT_VERSION_NOT_FOUND");
  const [version] = await db.select().from(marketingContentVersions).where(and(eq(marketingContentVersions.id, content.currentVersionId), eq(marketingContentVersions.contentId, content.id))).limit(1);
  if (!version) throw new MarketingGateError("CONTENT_VERSION_NOT_FOUND");
  return { content, version };
}

function allowedCanonicalUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || !canonicalHosts.has(url.hostname)) throw new MarketingGateError("CANONICAL_URL_NOT_ALLOWED");
  return url.toString();
}

export async function updateMarketingGates(contentId: number, request: MarketingGateRequest, actor = "admin") {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${contentId})`);
    const [content] = await tx.select().from(marketingContents).where(eq(marketingContents.id, contentId)).limit(1);
    if (!content) throw new MarketingGateError("CONTENT_NOT_FOUND");
    if (!content.currentVersionId) throw new MarketingGateError("CONTENT_VERSION_NOT_FOUND");
    const [version] = await tx.select().from(marketingContentVersions).where(and(eq(marketingContentVersions.id, content.currentVersionId), eq(marketingContentVersions.contentId, content.id))).limit(1);
    if (!version) throw new MarketingGateError("CONTENT_VERSION_NOT_FOUND");
    const canonicalUrl = request.canonicalUrl ? allowedCanonicalUrl(request.canonicalUrl) : null;
    const now = new Date();
    await tx.update(marketingContentVersions).set({
      duplicateGate: request.duplicateGate,
      siteFirstStatus: request.siteFirstStatus,
      canonicalUrl,
      expectedArticleIdentity: request.expectedArticleIdentity,
      canonicalReadbackStatus: canonicalUrl === version.canonicalUrl && request.expectedArticleIdentity === version.expectedArticleIdentity ? version.canonicalReadbackStatus : "UNKNOWN",
    }).where(eq(marketingContentVersions.id, version.id));
    await tx.update(marketingContents).set({ updatedAt: now }).where(eq(marketingContents.id, content.id));
    await tx.insert(marketingAuditLogs).values({ contentId: content.id, versionId: version.id, actor, action: "marketing_gates_updated", details: { duplicateGate: request.duplicateGate, siteFirstStatus: request.siteFirstStatus, canonicalConfigured: Boolean(canonicalUrl), canonicalReadbackPreserved: canonicalUrl === version.canonicalUrl && request.expectedArticleIdentity === version.expectedArticleIdentity } });
    return { contentId: content.id, versionId: version.id };
  });
}

function htmlTitle(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1000) || null;
}

function observedIdentity(html: string, expected: string) {
  const index = html.toLocaleLowerCase("ko-KR").indexOf(expected.toLocaleLowerCase("ko-KR"));
  if (index < 0) return null;
  return html.slice(Math.max(0, index - 120), index + expected.length + 180).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1000);
}

export async function recordCanonicalReadback(contentId: number, input: { canonicalUrl: string; expectedArticleIdentity: string }, actor = "admin") {
  const canonicalUrl = allowedCanonicalUrl(input.canonicalUrl);
  const { content, version } = await currentVersion(contentId);
  let httpStatus: number | null = null;
  let responseText: string | null = null;
  let observedTitle: string | null = null;
  try {
    const response = await fetch(canonicalUrl, { cache: "no-store", redirect: "follow", signal: AbortSignal.timeout(12000), headers: { accept: "text/html,application/xhtml+xml" } });
    httpStatus = response.status;
    const finalUrl = new URL(response.url);
    if (finalUrl.protocol === "https:" && canonicalHosts.has(finalUrl.hostname)) {
      responseText = (await response.text()).slice(0, 512000);
      observedTitle = htmlTitle(responseText);
    }
  } catch (error) {
    if (error instanceof MarketingGateError) throw error;
  }
  const result = canonicalReadbackResult({ httpStatus, expectedArticleIdentity: input.expectedArticleIdentity, observedTitle, responseText });
  const now = new Date();
  const observed = responseText ? observedIdentity(responseText, input.expectedArticleIdentity) : null;
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${contentId})`);
    await tx.insert(marketingCanonicalReadbacks).values({ contentId: content.id, versionId: version.id, canonicalUrl, httpStatus, expectedArticleIdentity: input.expectedArticleIdentity, observedTitle, observedIdentity: observed, result, checkedAt: now });
    await tx.update(marketingContentVersions).set({ canonicalUrl, expectedArticleIdentity: input.expectedArticleIdentity, canonicalReadbackStatus: result, siteFirstStatus: result === "PASS" ? "PUBLISHED" : "FAILED" }).where(eq(marketingContentVersions.id, version.id));
    await tx.update(marketingContents).set({ updatedAt: now }).where(eq(marketingContents.id, content.id));
    await tx.insert(marketingAuditLogs).values({ contentId: content.id, versionId: version.id, actor, action: result === "PASS" ? "canonical_readback_passed" : "canonical_readback_failed", details: { canonicalHost: new URL(canonicalUrl).hostname, httpStatus, expectedIdentityLength: input.expectedArticleIdentity.length } });
  });
  return { contentId: content.id, versionId: version.id, canonicalUrl, httpStatus, observedTitle, observedIdentity: observed, result, checkedAt: now };
}

export async function latestCanonicalReadbacks(versionId: number) {
  return db.select().from(marketingCanonicalReadbacks).where(eq(marketingCanonicalReadbacks.versionId, versionId)).orderBy(desc(marketingCanonicalReadbacks.checkedAt));
}
