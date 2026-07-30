import { describe, expect, it } from "vitest";

import { canDeleteCandidateProfile } from "./profile-policy";

describe("candidate profile deletion policy", () => {
  it("prevents deletion when only one profile remains", () => {
    expect(canDeleteCandidateProfile(1)).toBe(false);
    expect(canDeleteCandidateProfile(0)).toBe(false);
    expect(canDeleteCandidateProfile(2)).toBe(true);
  });
});
