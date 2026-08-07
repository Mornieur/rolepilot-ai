import "server-only";
import type { JobUserStatus } from "@/types/domain";
import { jobStatusInputSchema } from "@/features/job-actions/schema";
import { getSupabaseServerClient } from "@/features/profiles/server/supabase";
export class JobStatusDataError extends Error { constructor(message = "Job status could not be saved.") { super(message); } }
const allowed: JobUserStatus[] = ["new", "saved", "ignored", "applied", "rejected"];
export const isJobUserStatus = (value: string): value is JobUserStatus => allowed.includes(value as JobUserStatus);
export async function getStatus(profileId: string, jobId: string) { const { data, error } = await getSupabaseServerClient().from("job_user_statuses").select("*").eq("profile_id", profileId).eq("job_id", jobId).maybeSingle(); if (error) throw new JobStatusDataError(); return data ? { status: data.status as JobUserStatus, notes: data.notes } : { status: "new" as const, notes: null }; }
export async function saveStatus(profileId: string, jobId: string, status: JobUserStatus, notes: string | null = null) { const parsed = jobStatusInputSchema.safeParse({ profileId, jobId, status, notes: notes ?? undefined }); if (!parsed.success) throw new JobStatusDataError("Job status is invalid."); const { data, error } = await getSupabaseServerClient().from("job_user_statuses").upsert({ profile_id: parsed.data.profileId, job_id: parsed.data.jobId, status: parsed.data.status, notes: parsed.data.notes ?? null }, { onConflict: "profile_id,job_id" }).select().single(); if (error || !data) throw new JobStatusDataError(); return { status: data.status as JobUserStatus, notes: data.notes }; }
export const updateStatus = saveStatus;
export async function listStatusCountsByProfile(profileId: string) { const { data, error } = await getSupabaseServerClient().from("job_user_statuses").select("status").eq("profile_id", profileId); if (error) throw new JobStatusDataError("Job statuses could not be loaded."); const counts: Record<JobUserStatus, number> = { new: 0, saved: 0, ignored: 0, applied: 0, rejected: 0 }; for (const row of data ?? []) if (isJobUserStatus(row.status)) counts[row.status] += 1; return counts; }
