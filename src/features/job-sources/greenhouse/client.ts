import "server-only";

import type { TargetCompany } from "@/types/domain";

import { GreenhouseError } from "@/features/job-sources/greenhouse/errors";
import { mapGreenhouseResponse } from "@/features/job-sources/greenhouse/mapper";
import { greenhouseBoardIdentifierSchema } from "@/features/job-sources/greenhouse/schemas";
import type { GreenhousePreviewResult } from "@/features/job-sources/greenhouse/types";

export function greenhouseJobsUrl(boardIdentifier: string) {
  const parsed = greenhouseBoardIdentifierSchema.safeParse(boardIdentifier);
  if (!parsed.success) throw new GreenhouseError("invalid-board");
  return `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(parsed.data)}/jobs?content=true`;
}

export async function fetchGreenhouseJobs(company: TargetCompany): Promise<GreenhousePreviewResult> {
  const url = greenhouseJobsUrl(company.boardIdentifier);
  let response: Response;
  try { response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10_000) }); }
  catch (error) {
    if (error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError")) throw new GreenhouseError("timeout");
    throw new GreenhouseError("unavailable");
  }
  if (response.status === 404) throw new GreenhouseError("not-found");
  if (!response.ok) throw new GreenhouseError("unavailable");
  let payload: unknown;
  try { payload = await response.json(); } catch { throw new GreenhouseError("invalid-response"); }
  try { return mapGreenhouseResponse(payload, company); } catch { throw new GreenhouseError("invalid-response"); }
}
