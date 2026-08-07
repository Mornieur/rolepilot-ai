import { describe, expect, it } from "vitest";

import { jobStatusInputSchema } from "./schema";

const ids = { profileId: "11111111-1111-4111-8111-111111111111", jobId: "22222222-2222-4222-8222-222222222222" };

describe("job status schema", () => {
  it.each(["saved", "ignored", "applied", "rejected"])("accepts %s", (status) => expect(jobStatusInputSchema.safeParse({ ...ids, status }).success).toBe(true));
  it("rejects an invalid status", () => expect(jobStatusInputSchema.safeParse({ ...ids, status: "dismissed" }).success).toBe(false));
  it("trims notes and enforces their limit", () => {
    expect(jobStatusInputSchema.parse({ ...ids, status: "saved", notes: "  Follow up tomorrow.  " }).notes).toBe("Follow up tomorrow.");
    expect(jobStatusInputSchema.safeParse({ ...ids, status: "saved", notes: "x".repeat(1001) }).success).toBe(false);
  });
});
