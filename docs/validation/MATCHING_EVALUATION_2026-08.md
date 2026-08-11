# Deterministic matching evaluation — 2026-08

## Scope and production baseline

This is the first successful production diagnostic for `Maria Fernanda - Front-end`. It is read-only, server-side, deterministic, and used no Gemini code path or database write.

- 275 persisted jobs: 263 active and 12 inactive.
- 6 compatible (2%) and 269 rejected.
- Companies: iFood 0/100, VTEX 2/30, Wellhub 4/118, Wildlife Studios 0/21 (compatible/rejected).
- Scores: 90–100: 1; 80–89: 3; 70–79: 2; 60–69: 1; 50–59: 2; below 50: 266.
- Hard reasons (not mutually exclusive): title 268, required skills 265, work model 4.
- Warnings: location mismatch 131, seniority unknown 128, work-model unknown 113, seniority mismatch 71, partial required skills 7.

The profile evidence confirms React and TypeScript as required, remote and hybrid as accepted work models, and mid/senior as accepted seniorities. Its frontend intent also includes a generic software-engineering title path; that path remains deliberately adjacent rather than a general software-role pass.

## Matcher architecture

The matcher normalizes title, description, location, departments, and offices (case/accents/punctuation) and performs whole-term deterministic matching. Score is title +25, required coverage +35, preferred up to +15, excluded -40, and seniority/location/work-model ±10; it is clamped to 0–100. Eligibility is strictly `title && required && !excluded && compatible-work-model`. Seniority, location, score, and unknown values never silently decide eligibility. Gemini is not part of this path.

Required skills mean **B: minimum coverage**, not “every configured skill” and not parsing the job’s own requirements. Unique configured terms are counted across searchable text; 50% passes. With React and TypeScript, one exact token passes with a partial-coverage warning, while zero fails. This explains much of the 265 count for unrelated jobs and retains a literal-extraction limitation (no aliases or inferred experience). No threshold change is supported.

## Findings

The 2% rate is predominantly expected for a full-company-board collection: iFood and Wildlife Studios produced no compatible roles, while six results are concentrated in VTEX and Wellhub. The high title and required counts overlap because one rejected job contributes every failed hard rule; they do not identify 268 separate title-only failures. Most unrelated roles have neither a frontend title family nor React/TypeScript evidence.

Direct frontend title families are `Frontend`/`Front-end` and `UI Engineer`. Adjacent families are generic `Software Engineer`, Full Stack, Web Engineer, and Design System Engineer: they require frontend evidence outside the title. Backend, data, designer, sales, legal, finance, security, mobile, product, HR/recruiting, and similarly distant titles do not gain an adjacent pass.

`Senior Backend Engineer`, `Senior Software Engineer | Billing`, and `Senior Software Engineer, Cloud` remain correctly rejected: their scores reflect other signals, but no compatible frontend family/evidence. `Software Engineer Specialist - IA | Full Stack` scores zero because Full Stack is adjacent and the collected content matches neither frontend requirement evidence nor React/TypeScript; that is logically correct. `Associate Field Software Engineer` remains ambiguous and may only pass with actual frontend requirements. `Frontend Engineering Manager | Design System` is title-compatible, but manager/staff is a seniority mismatch; by policy it remains eligible, not an asserted target role.

The confirmed defect was `UI Designer`: the prior broad `ui` title signal could grant it +25 as a frontend title. The calibration distinguishes direct `UI Engineer` from distant `UI Designer`. It also makes Web and Design System Engineer explicit adjacent families requiring evidence outside the title. This is a bounded precision correction, not fuzzy matching or threshold relaxation.

Seniority is title-only: unknown is neutral; mismatch is -10 and a warning. Therefore 128 unknown and 71 mismatch are not hidden eliminations. Manager/staff jobs can rank highly where other signals are strong; supplied evidence does not establish them as false positives, so seniority policy is unchanged.

Location is checked only against location/offices: mismatch is -10 and warning, unknown is neutral. Thus the 131 mismatches cannot eliminate relevant opportunities. Work model scans explicit phrases in description plus location/offices. Multiple remote/hybrid/on-site results can come from source policy text or genuinely flexible roles; aggregate evidence cannot distinguish these Wellhub records. Unknown is neutral; only a detected set with no accepted model rejects. No scraping change is justified.

The prior false-negative diagnostic was too broad: it flagged UI Designer and Sales Solution Engineer for incidental frontend text. It now requires a frontend/adjacent title family, frontend requirement evidence, and exactly one hard blocker. It remains a review queue, not a claim of an error. No confirmed production false negative was demonstrated by the supplied cases; UI Designer is a confirmed false title-positive signal but was already ineligible through required skills.

## Calibration and regression coverage

- `UI Designer`: title now fails even when content mentions UI/React; status remains rejected.
- `UI Engineer`: remains a clear direct positive.
- Web Engineer: positive only with frontend requirements; otherwise rejected.
- Design System Engineer: positive only with frontend requirements; otherwise rejected.
- Diagnostics: Sales Solution Engineer and UI Designer no longer surface merely from keyword presence.

Fixtures cover clear positives, clear negatives, and adjacent boundaries for these changes. No production data was modified and no aggregate post-change count is claimed. Expected production impact: small precision improvement and a smaller, more credible diagnostic review queue; the known six compatible examples retain their semantics unless unreported source text differs from the diagnostic evidence.

## Explicit non-changes and retest

- No Gemini runtime calls, embeddings, learning, fuzzy matching, score-weight/threshold changes, source-collection changes, Auth/RLS changes, migration, deployment, or database write.
- Retest production by loading `/insights/matching` as an authenticated admin, selecting Maria’s profile, recording the exact profile fields and the new aggregates, and manually opening each changed-title candidate plus all six eligible records. Compare title reasons and false-negative queue before accepting any further calibration.
