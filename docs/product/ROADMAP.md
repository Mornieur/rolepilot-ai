# Roadmap

1. **Implemented:** source of truth, Portuguese-first MVP navigation, manual Greenhouse preview/save with plain-text normalization, Gemini free-tier runtime with persisted manual analysis history, persisted job actions, deterministic descriptive insights, FeitozaUI visual rollout, and a compact evaluation workflow with on-demand diagnostics and visible decision pending feedback.
2. **Implemented:** scheduled Greenhouse collection foundation: shared manual/scheduled orchestration, run history, partial-failure isolation, lifecycle closure/reactivation, protected scheduler route, GitHub Actions workflow and operational last-run status. Production scheduled execution and `workflow_dispatch` are validated.
3. **Implemented:** durable deterministic notification-candidate outbox for newly created eligible jobs, scoped by profile/job/event and without delivery channels or automatic Gemini.
4. **Implemented:** Telegram delivery for pending deterministic outbox events, with a protected worker and bounded retries; no automatic Gemini.
5. **Implemented and production smoke-tested:** Supabase Auth is the interactive-user boundary with private email/password login, persisted roles, profile ownership, RLS, and server authorization; the temporary HTTP Basic gate is removed.
6. **Implemented:** Opportunity Inbox V1: a profile-scoped, active-and-eligible daily queue with deterministic priority, decision filters, and existing manual decision actions; it has no automatic Gemini or read-time writes.
7. **Planned:** a second adapter and additional product workflows.
8. **Implemented locally, pending migration application and live smoke test:** Opportunity Intelligence V1 with canonical detail, explicit Tavily retrieval, cited Gemini synthesis and evidence-based preparation.

No dates are committed. 7. **Implemented, pending deployed smoke test:** admin-only deterministic matching diagnostics. The surface is descriptive and read-only; calibration remains a separate milestone after real current-sample review.
