# Workflow

Use `main`, `develop` and features based on updated `develop`; document stacked branches. Before acting, confirm branch, commits, and prerequisites. One slice per task. Dependencies, migrations, providers, costs, and public APIs need explicit review.

For UI, import FeitozaUI only from its public entrypoint, preserve Server/Client boundaries, validate light/dark theme, mobile, accessibility, and record route adoption. Codex validates using the pre-authorized safe-command policy in `AGENTS.md`, leaves changes uncommitted, and only suggests a commit; it does not push or use destructive Git without authorization.
