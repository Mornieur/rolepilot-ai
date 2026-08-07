import { ProfileManager } from "@/features/profiles/components/profile-manager";
import { loadCandidateProfiles } from "@/features/profiles/server/load-profiles";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProfilesPage() {
  const result = await loadCandidateProfiles();
  if (result.error !== null) return <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900"><div className="mx-auto max-w-xl rounded-lg border border-red-200 bg-white p-6"><h1 className="text-2xl font-semibold">Profile management unavailable</h1><p className="mt-3 text-slate-600">{result.error}</p><Link href="/" className="mt-5 inline-block font-medium text-blue-700 underline underline-offset-4">Back to dashboard</Link></div></main>;
  return <ProfileManager profiles={result.profiles} />;
}
