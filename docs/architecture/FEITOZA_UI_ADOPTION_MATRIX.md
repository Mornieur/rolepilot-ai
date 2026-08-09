# FeitozaUI adoption matrix

FeitozaUI is the official visual base. RolePilot uses `@feitoza-ui/core@0.3.0` via its public entrypoint; Tailwind remains for responsive composition.

| Rota             | Elemento                            | FeitozaUI usado                                      | HTML nativo mantido                            | Gap                                                   |
| ---------------- | ----------------------------------- | ---------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------- |
| `/`              | Dashboard, counters, profile choice | `Surface`, `Card`, `Select`                          | landmarks, links, lists, options               | Mock analyses stay clearly identified; no graph added |
| `/profiles`      | Profile manager                     | `Surface`                                            | forms, labels, inputs                          | None found                                            |
| `/companies`     | Company manager                     | `Surface`                                            | forms, labels, inputs, links                   | None found                                            |
| `/jobs`          | List and states                     | `Surface`, `Card`, `EmptyState`, `Alert`             | article, heading, links                        | None found                                            |
| `/jobs/evaluate` | Profile filter and page states      | `Surface`, `Select`, `Button`, `EmptyState`, `Alert` | form, options, landmarks                       | None found                                            |
| `/jobs/evaluate` | Result, Gemini analysis, decision   | `Card`, `Surface`, `Button`, `EmptyState`            | article, headings, lists, hidden inputs, links | Gemini result remains ephemeral by product decision   |
| `/insights`      | Insight controls and surfaces       | `Surface`, `Card`, `Select`, `Button`                | headings and links                             | None found                                            |

No visual migration alters business rules.
