import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({ data: null as unknown, error: null as unknown, upsert: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/features/profiles/server/supabase", () => ({ getSupabaseServerClient: () => ({ from: () => ({ select: () => { const query = { eq: () => query, maybeSingle: async () => ({ data: database.data, error: database.error }), then: (resolve: (value: unknown) => unknown) => resolve({ data: database.data, error: database.error }) }; return query; }, upsert: database.upsert }) }) }));

import { getStatus, JobStatusDataError, listStatusCountsByProfile, saveStatus } from "./job-statuses";

const profileId = "11111111-1111-4111-8111-111111111111";
const jobId = "22222222-2222-4222-8222-222222222222";

describe("job status data access", () => {
  beforeEach(() => {
    database.data = null; database.error = null;
    database.upsert.mockReset().mockReturnValue({ select: () => ({ single: async () => ({ data: { status: "saved", notes: " note " }, error: null }) }) });
  });

  it("returns new when a profile has not made an explicit decision", async () => expect(await getStatus(profileId, jobId)).toEqual({ status: "new", notes: null }));
  it("creates or updates one row using the profile and job uniqueness key", async () => {
    await saveStatus(profileId, jobId, "saved", "  note ");
    expect(database.upsert).toHaveBeenCalledWith({ profile_id: profileId, job_id: jobId, status: "saved", notes: "note" }, { onConflict: "profile_id,job_id" });
  });
  it("returns a controlled database error", async () => { database.error = { message: "database unavailable" }; await expect(getStatus(profileId, jobId)).rejects.toBeInstanceOf(JobStatusDataError); });
  it("counts only the selected profile and returns zero for absent states", async () => {
    database.data = [{ status: "saved" }, { status: "saved" }, { status: "applied" }];
    await expect(listStatusCountsByProfile(profileId)).resolves.toMatchObject({ saved: 2, applied: 1, ignored: 0, rejected: 0 });
  });
});
