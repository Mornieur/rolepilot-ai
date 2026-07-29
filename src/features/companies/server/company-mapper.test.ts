import { describe, expect, it } from "vitest";

import { toTargetCompany } from "./company-mapper";

describe("target company row mapping", () => {
  it("maps database snake_case rows to the domain model", () => {
    expect(toTargetCompany({ id: "11111111-1111-4111-8111-111111111111", name: "Example", provider: "lever", board_identifier: "example", careers_url: null, enabled: false, priority: "high", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-02T00:00:00Z" })).toEqual({ id: "11111111-1111-4111-8111-111111111111", name: "Example", provider: "lever", boardIdentifier: "example", careersUrl: undefined, enabled: false, priority: "high", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-02T00:00:00Z" });
  });
});
