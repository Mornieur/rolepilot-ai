export type CandidateProfileRow = {
  id: string;
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
  id: string; provider: string; target_company_id: string; external_id: string; title: string; location: string | null; description_text: string | null; original_url: string; source_updated_at: string | null; language: string | null; departments: string[] | null; offices: string[] | null; first_seen_at: string; last_seen_at: string; created_at: string; updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      candidate_profiles: {
        Row: CandidateProfileRow;
        Insert: Omit<CandidateProfileRow, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Omit<CandidateProfileRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      target_companies: {
        Row: TargetCompanyRow;
        Insert: Omit<TargetCompanyRow, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Omit<TargetCompanyRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      jobs: {
        Row: PersistedJobRow;
        Insert: Omit<PersistedJobRow, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Omit<PersistedJobRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
