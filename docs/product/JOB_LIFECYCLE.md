# Job lifecycle

Each persisted job has an independent manual decision for each candidate profile. `new` means that no explicit decision row exists. Explicit states are `saved`, `ignored`, `applied`, and `rejected`.

Any manual transition is allowed. The relation row keeps timestamps and an optional note; notes are not yet available in the UI. A job action does not alter the job or profile, trigger AI or notifications, or submit an application automatically.

Future closing rules require three successful collections without the job; provider failures do not count. Source updates do not resend notifications by default.
