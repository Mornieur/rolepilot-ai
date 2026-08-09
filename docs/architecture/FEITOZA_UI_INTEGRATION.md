# FeitozaUI

FeitozaUI is RolePilot's official visual base. The app consumes only the public `@feitoza-ui/core@0.3.0` entrypoint: no copied source and no internal imports.

The rollout uses `Surface`, `Card`, `Button`, `Select`, `Alert`, and `EmptyState` where appropriate. Tailwind CSS remains for responsive layout and product composition, not a second token system. Light/dark theme persistence, visible focus, semantic HTML, external-link labels, and non-colour error/status text are retained.

Data loading and secrets remain server-side. Client boundaries are limited to theme, dashboard profile selection, filters, decisions, and manual Gemini request state. This migration changes no business rule, score, eligibility, Supabase behavior, or Gemini call count. Native form, landmark, heading, list, link, option, and hidden-input HTML is intentionally preserved.

For future UI, assess whether a public FeitozaUI component is suitable before adding any new visual component. Prefer FeitozaUI when it is suitable; keep native HTML when it is semantically better. Do not add prop-only wrappers or copy library code.

See [FEITOZA_UI_ADOPTION_MATRIX.md](FEITOZA_UI_ADOPTION_MATRIX.md) for per-route adoption and genuine gaps.
