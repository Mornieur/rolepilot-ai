<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# RolePilot source of truth

Leitura obrigatória, nesta ordem: `docs/CURRENT_STATE.md`, `docs/DECISIONS.md`, `docs/product/PRODUCT_VISION.md`, `docs/product/MVP_SCOPE.md`, `docs/architecture/COST_POLICY.md`, a arquitetura pertinente, `docs/development/WORKFLOW.md` e `docs/development/DEFINITION_OF_DONE.md`.

README sozinho não é fonte de verdade: confirme Git e filesystem e não infira conclusão pela documentação. Não recrie pré-requisitos nem crie branch de `develop` sem verificar commits; pare se a linhagem estiver errada. Não resolva conflitos silenciosamente, introduza serviços pagos, inicie fase futura, exponha segredos, use processos persistentes/polling, deixe comando sem saída por cinco minutos ou execute validação pesada em paralelo. Preserve trabalho alheio e reporte validações incompletas honestamente.

# Safe command execution policy

Codex SHOULD run routine safe inspection and validation commands directly, without asking the user for confirmation first. Run quality validation sequentially; do not run heavy validation in parallel.

## Pre-authorized commands

- Git read-only: `git status`, `git status --short`, `git diff`, `git diff --check`, `git diff --stat`, `git log`, `git show`, `git branch`, `git branch --show-current`, `git remote -v`, `git rev-parse`, `git ls-files`, and `git check-ignore`.
- Repository inspection: `rg`, `grep`, `find` used only for repository inspection, `cat`, `type`, or `Get-Content` for non-secret project files, directory listings, `npm ls`, and `npm explain`.
- Formatting and quality: `npm run format`, `npm run format:check`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check`, and `npm audit`.
- Package inspection: `npm view`, `npm ls`, `npm explain`, and `npm audit`.
- Supabase local/read-only inspection: `npx supabase --version`, `npx supabase migration list`, and inspection of migration files, provided they do not mutate remote data.

The standard Definition of Done validation suite is pre-authorized and should run sequentially whenever required: `npm run format:check`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check`, and `npm audit`. Do not ask separately to run tests, lint, or build.

## Explicit authorization required

Do not implicitly run `git commit`, `git push`, `git merge`, `git rebase`, `git reset`, `git checkout` or `git switch` when it changes task lineage, `git stash`, `git clean`, force pushes, branch deletion, or tag creation.

Also require explicit authorization for `npm publish`, releases or version bumps, package publication, `npm audit fix`, `npm audit fix --force`, live database migrations, database resets, destructive SQL, production deployments, billing enablement, paid-service activation, paid-resource creation, external messages or notifications, real Gemini calls unless live validation is explicitly in scope, bulk external API operations, and operations involving secrets.

Installing a dependency needs no separate confirmation only when the current task explicitly requires that dependency and it is free/non-billed. Otherwise, report the dependency first. Do not run remote Supabase mutations such as `db push`, migration application, resets, or destructive operations without explicit authorization unless the task explicitly authorizes them.

## Persistent processes

Do not start persistent background servers unless required, do not leave dev servers running after validation, and do not use polling loops. No command may remain without output for more than five minutes; stop and diagnose hung commands. A temporary foreground dev server is allowed only when the current task explicitly requires manual or browser validation, and it must be stopped afterward.

## Secret safety

Never inspect or print `.env.local`, `GEMINI_API_KEY`, Supabase secret or service keys, database passwords, access tokens, or authentication headers. Existence checks may report only `configured` or `missing`, never values, prefixes, lengths, or fingerprints.
