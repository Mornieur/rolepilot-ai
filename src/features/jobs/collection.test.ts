import { describe, expect, it } from "vitest";
import { collectionStatus, normalizeSourceArray, sourceIdentity } from "./collection";
import type { ExternalJobPreview } from "@/features/job-sources/greenhouse/types";
import type { PersistedJob } from "@/types/domain";

const preview: ExternalJobPreview = { externalId: "1", provider: "greenhouse", companyId: "company", companyName: "Company", title: "Engineer", location: "Remote", descriptionText: "Description", originalUrl: "https://example.test/1", sourceUpdatedAt: "2026-01-01", language: "en", departments: ["Engineering", "Platform"], offices: ["São Paulo"] };
const persisted: PersistedJob = { id: "job", ...preview, targetCompanyId: "company", firstSeenAt: "2026-01-01", lastSeenAt: "2026-01-01", createdAt: "2026-01-01", updatedAt: "2026-01-01" };

describe("job collection comparison", () => {
  it("uses provider, company, and external ID as the source identity", () => expect(sourceIdentity(preview)).toBe("greenhouse:company:1"));
  it("classifies new, unchanged, and changed jobs deterministically", () => { expect(collectionStatus(undefined, preview)).toBe("created"); expect(collectionStatus(persisted, { ...preview, departments: ["Platform", "Engineering"] })).toBe("unchanged"); expect(collectionStatus(persisted, { ...preview, title: "Senior Engineer" })).toBe("updated"); expect(collectionStatus(persisted, { ...preview, location: "Berlin" })).toBe("updated"); expect(collectionStatus(persisted, { ...preview, descriptionText: "Changed" })).toBe("updated"); });
  it("normalizes array order and duplicates", () => expect(normalizeSourceArray(["B", "A", "A", " "])).toEqual(["A", "B"]));
});
