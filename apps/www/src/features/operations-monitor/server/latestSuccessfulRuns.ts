import type { MonitoredJobName } from "../domain";

export type LatestSuccessfulRunLookup = (jobName: MonitoredJobName) => Promise<Date | null>;

export async function collectLatestSuccessfulRuns(
  jobNames: readonly MonitoredJobName[],
  lookup: LatestSuccessfulRunLookup,
) {
  return Promise.all(jobNames.map(async (jobName) => ({ jobName, completedAt: await lookup(jobName) })));
}
