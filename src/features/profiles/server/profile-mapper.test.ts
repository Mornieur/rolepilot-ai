import { describe, expect, it } from "vitest";

import { toCandidateProfile } from "./profile-mapper";

describe("candidate profile row mapping", () => {
  it("maps snake_case database rows and normalizes nullable arrays", () => {
    const profile = toCandidateProfile({ id: "11111111-1111-4111-8111-111111111111", name: "Profile", desired_roles: ["Engineer"], accepted_seniorities: ["senior", "unknown"], required_skills: null, preferred_skills: null, excluded_skills: [], accepted_work_models: ["remote", "flexible"], locations: ["Brazil"], created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" });
    expect(profile).toEqual({ id: "11111111-1111-4111-8111-111111111111", name: "Profile", desiredRoles: ["Engineer"], acceptedSeniorities: ["senior"], requiredSkills: [], preferredSkills: [], excludedSkills: [], acceptedWorkModels: ["remote"], locations: ["Brazil"] });
  });
});
