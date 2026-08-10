# Roadmap

1. **Implemented:** source of truth, Portuguese-first MVP navigation, manual Greenhouse preview/save with plain-text normalization, Gemini free-tier runtime with persisted manual analysis history, persisted job actions, deterministic descriptive insights, FeitozaUI visual rollout, and a compact evaluation workflow with on-demand diagnostics and visible decision pending feedback.
2. **Implemented:** scheduled Greenhouse collection foundation: shared manual/scheduled orchestration, run history, partial-failure isolation, lifecycle closure/reactivation, protected scheduler route, GitHub Actions workflow and operational last-run status. Production scheduled execution and `workflow_dispatch` are validated.
3. **Implemented:** durable deterministic notification-candidate outbox for newly created eligible jobs, scoped by profile/job/event and without delivery channels or automatic Gemini.
4. **Implemented:** Telegram delivery for pending deterministic outbox events, with a protected worker and bounded retries; no automatic Gemini.
5. **Planned:** a second adapter, authentication/RLS, and additional product workflows.

No dates are committed.
