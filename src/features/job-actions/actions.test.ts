import { beforeEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => ({ profile: vi.fn(), job: vi.fn(), save: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/features/job-actions/server/job-statuses", () => ({ JobStatusDataError: class JobStatusDataError extends Error {}, saveStatus: dependencies.save }));
vi.mock("@/features/profiles/server/candidate-profiles", () => ({ getCandidateProfileById: dependencies.profile }));
vi.mock("@/features/jobs/server/persisted-jobs", () => ({ getPersistedJobById: dependencies.job }));
vi.mock("next/cache", () => ({ revalidatePath: dependencies.revalidate }));

import { initialJobStatusActionState, saveJobStatusAction } from "./actions";

const profileId = "11111111-1111-4111-8111-111111111111";
const jobId = "22222222-2222-4222-8222-222222222222";
const form = (entries: Record<string, string>) => { const result = new FormData(); Object.entries(entries).forEach(([key, value]) => result.set(key, value)); return result; };

describe("save job status action", () => {
  beforeEach(() => { dependencies.profile.mockReset().mockResolvedValue({ id: profileId }); dependencies.job.mockReset().mockResolvedValue({ id: jobId }); dependencies.save.mockReset().mockResolvedValue({ status: "saved", notes: null }); dependencies.revalidate.mockReset(); });
  it("validates IDs and status without accepting full job or profile payloads", async () => {
    await expect(saveJobStatusAction(initialJobStatusActionState, form({ profileId: "not-a-uuid", jobId, status: "saved", profile: "{}", job: "{}" }))).resolves.toMatchObject({ status: "error" });
    expect(dependencies.save).not.toHaveBeenCalled();
  });
  it("checks profile and job existence, persists only the decision, and revalidates affected routes", async () => {
    await expect(saveJobStatusAction(initialJobStatusActionState, form({ profileId, jobId, status: "saved", notes: "  keep  " }))).resolves.toMatchObject({ status: "success", current: "saved" });
    expect(dependencies.save).toHaveBeenCalledWith(profileId, jobId, "saved", "keep");
    expect(dependencies.revalidate).toHaveBeenCalledWith("/"); expect(dependencies.revalidate).toHaveBeenCalledWith("/jobs/evaluate");
  });
  it("does not save when the persisted profile or job does not exist", async () => { dependencies.job.mockResolvedValue(null); await expect(saveJobStatusAction(initialJobStatusActionState, form({ profileId, jobId, status: "saved" }))).resolves.toMatchObject({ status: "error" }); expect(dependencies.save).not.toHaveBeenCalled(); });
});
