import { Dashboard } from "@/features/jobs/components/dashboard";
import { jobAnalyses, jobs, profiles } from "@/features/jobs/mock-data";

export default function Home() {
  return <Dashboard profiles={profiles} jobs={jobs} analyses={jobAnalyses} />;
}
