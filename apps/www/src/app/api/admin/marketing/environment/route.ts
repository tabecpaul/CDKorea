import { hasAdminSession } from "@/features/admin/server/auth";
import { projectRefFromDatabaseUrl } from "@/features/marketing/server/environmentIdentity";

export async function GET() {
  if (!(await hasAdminSession())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const projectRef = projectRefFromDatabaseUrl(process.env.DATABASE_URL);
  if (!projectRef) return Response.json({ error: "production_identity_unknown" }, { status: 503 });
  return Response.json({ projectRef, deploymentSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null }, { headers: { "cache-control": "no-store" } });
}
