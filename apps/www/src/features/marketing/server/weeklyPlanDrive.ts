import { DriveError, readDriveText, type MarketingDriveClient } from "./drive";
import { parseWeeklyContentPlan, WeeklyPlanError, type WeeklyContentPlan } from "./weeklyPlan";

export class WeeklyPlanDriveError extends Error {
  constructor(public code: string) { super(code); }
}

function safeParse(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new WeeklyPlanDriveError("WEEKLY_PLAN_JSON_INVALID");
  }
}

export async function loadWeeklyContentPlan(client: MarketingDriveClient, weekStart: string): Promise<WeeklyContentPlan> {
  const ids = await client.listWeeklyPlanFiles();
  const matches: WeeklyContentPlan[] = [];
  for (const id of ids) {
    try {
      if (!(await client.isWithinOperationsFolder(id))) throw new WeeklyPlanDriveError("WEEKLY_PLAN_OUTSIDE_OPERATIONS_FOLDER");
      const plan = parseWeeklyContentPlan(safeParse(await readDriveText(client, id)));
      if (plan.weekStart === weekStart) matches.push(plan);
    } catch (error) {
      if (error instanceof WeeklyPlanError || error instanceof DriveError || error instanceof WeeklyPlanDriveError) throw error;
      throw new WeeklyPlanDriveError("WEEKLY_PLAN_READ_FAILED");
    }
  }
  if (matches.length === 0) throw new WeeklyPlanDriveError("WEEKLY_PLAN_NOT_FOUND");
  if (matches.length > 1) throw new WeeklyPlanDriveError("WEEKLY_PLAN_DUPLICATE");
  return matches[0];
}
