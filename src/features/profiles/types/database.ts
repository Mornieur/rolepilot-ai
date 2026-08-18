export type CandidateProfileRow = {
  id: string;
  user_id?: string | null;
  name: string;
  desired_roles: string[] | null;
  accepted_seniorities: string[] | null;
  required_skills: string[] | null;
  preferred_skills: string[] | null;
  excluded_skills: string[] | null;
  accepted_work_models: string[] | null;
  locations: string[] | null;
  created_at: string;
  updated_at: string;
};
export type AppUserRow = {
  user_id: string;
  display_name: string | null;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
};

export type TargetCompanyRow = {
  id: string;
  name: string;
  provider: string;
  board_identifier: string;
  careers_url: string | null;
  enabled: boolean;
  priority: string;
  created_at: string;
  updated_at: string;
};

export type PersistedJobRow = {
  id: string;
  provider: string;
  target_company_id: string;
  external_id: string;
  title: string;
  location: string | null;
  description_text: string | null;
  original_url: string;
  source_updated_at: string | null;
  language: string | null;
  departments: string[] | null;
  offices: string[] | null;
  first_seen_at: string;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
  is_active?: boolean;
  missing_successful_runs?: number;
  closed_at?: string | null;
};
export type JobUserStatusRow = {
  id: string;
  profile_id: string;
  job_id: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
export type JobAiAnalysisRow = {
  id: string;
  profile_id: string;
  job_id: string;
  provider: string;
  model: string;
  schema_version: string;
  result: unknown;
  recommendation: string;
  confidence: string;
  latency_ms: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  input_fingerprint: string | null;
  created_at: string;
};
export type OpportunityResearchDossierRow = {
  id: string;
  profile_id: string;
  job_id: string;
  schema_version: string;
  status: 'pending' | 'completed' | 'failed';
  research_fingerprint: string;
  structured_result: unknown | null;
  research_provider: 'tavily';
  synthesis_provider: 'gemini' | null;
  synthesis_model: string | null;
  researched_at: string | null;
  expires_at: string | null;
  error_classification: string | null;
  created_at: string;
  updated_at: string;
};
export type OpportunityResearchSourceRow = {
  id: string;
  dossier_id: string;
  tier: number;
  source_kind: string;
  title: string;
  organization: string | null;
  domain: string;
  url: string;
  published_at: string | null;
  collected_at: string;
  evidence_scopes: string[] | null;
  normalized_excerpt: string;
  evidence_classification: string;
};
export type CollectionRunRow = {
  id: string;
  trigger: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  companies_attempted: number;
  companies_succeeded: number;
  companies_failed: number;
  discovered_count: number;
  created_count: number;
  updated_count: number;
  unchanged_count: number;
  malformed_count: number;
  skipped_count: number;
  company_results: unknown;
};
export type JobNotificationEventRow = {
  id: string;
  profile_id: string;
  job_id: string;
  event_type: 'new_eligible_job';
  status: 'pending' | 'delivered' | 'failed' | 'skipped';
  priority: 'excellent' | 'good' | 'review';
  deterministic_score: number;
  channel: string | null;
  attempt_count: number;
  last_attempt_at: string | null;
  delivered_at: string | null;
  error_classification:
    | 'configuration'
    | 'timeout'
    | 'unauthorized'
    | 'rate_limit'
    | 'bad_request'
    | 'telegram_unavailable'
    | 'persistence_failure'
    | 'unknown'
    | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      app_users: {
        Row: AppUserRow;
        Insert: Omit<AppUserRow, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<AppUserRow, 'user_id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      candidate_profiles: {
        Row: CandidateProfileRow;
        Insert: Omit<CandidateProfileRow, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<CandidateProfileRow, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      target_companies: {
        Row: TargetCompanyRow;
        Insert: Omit<TargetCompanyRow, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<TargetCompanyRow, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      jobs: {
        Row: PersistedJobRow;
        Insert: Omit<PersistedJobRow, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<PersistedJobRow, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      job_user_statuses: {
        Row: JobUserStatusRow;
        Insert: Omit<JobUserStatusRow, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<JobUserStatusRow, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      job_ai_analyses: {
        Row: JobAiAnalysisRow;
        Insert: Omit<JobAiAnalysisRow, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
      opportunity_research_dossiers: {
        Row: OpportunityResearchDossierRow;
        Insert: Omit<OpportunityResearchDossierRow, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Omit<OpportunityResearchDossierRow, 'id' | 'profile_id' | 'job_id' | 'created_at'>
        >;
        Relationships: [];
      };
      opportunity_research_sources: {
        Row: OpportunityResearchSourceRow;
        Insert: Omit<OpportunityResearchSourceRow, 'id' | 'collected_at'> & {
          id?: string;
          collected_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      collection_runs: {
        Row: CollectionRunRow;
        Insert: Omit<
          CollectionRunRow,
          | 'id'
          | 'started_at'
          | 'finished_at'
          | 'companies_attempted'
          | 'companies_succeeded'
          | 'companies_failed'
          | 'discovered_count'
          | 'created_count'
          | 'updated_count'
          | 'unchanged_count'
          | 'malformed_count'
          | 'skipped_count'
          | 'company_results'
        > &
          Partial<
            Pick<
              CollectionRunRow,
              | 'finished_at'
              | 'companies_attempted'
              | 'companies_succeeded'
              | 'companies_failed'
              | 'discovered_count'
              | 'created_count'
              | 'updated_count'
              | 'unchanged_count'
              | 'malformed_count'
              | 'skipped_count'
              | 'company_results'
            >
          >;
        Update: Partial<Omit<CollectionRunRow, 'id' | 'trigger' | 'started_at'>>;
        Relationships: [];
      };
      job_notification_events: {
        Row: JobNotificationEventRow;
        Insert: Omit<
          JobNotificationEventRow,
          | 'id'
          | 'created_at'
          | 'attempt_count'
          | 'last_attempt_at'
          | 'delivered_at'
          | 'error_classification'
          | 'channel'
        > &
          Partial<
            Pick<
              JobNotificationEventRow,
              | 'id'
              | 'created_at'
              | 'attempt_count'
              | 'last_attempt_at'
              | 'delivered_at'
              | 'error_classification'
              | 'channel'
            >
          >;
        Update: Partial<
          Omit<
            JobNotificationEventRow,
            'id' | 'profile_id' | 'job_id' | 'event_type' | 'created_at'
          >
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      acquire_collection_run: {
        Args: { p_trigger: string; p_stale_before: string };
        Returns: { run_id: string | null; acquired: boolean }[];
      };
      persist_completed_opportunity_research_dossier: {
        Args: {
          p_profile_id: string;
          p_job_id: string;
          p_schema_version: string;
          p_research_fingerprint: string;
          p_structured_result: unknown;
          p_synthesis_model: string;
          p_researched_at: string;
          p_expires_at: string;
          p_sources: unknown;
        };
        Returns: OpportunityResearchDossierRow;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
