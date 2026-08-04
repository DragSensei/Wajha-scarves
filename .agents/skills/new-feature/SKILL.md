---
name: new-feature
description: >
  Use this skill whenever the user types /new-feature, wants to add a new feature,
  new functionality, a new page/endpoint/screen, or any capability that doesn't
  yet exist in the codebase. Trigger it automatically on requests like "add a
  way for users to X," "I need Y to be possible," "build a Z feature," or any
  ask that introduces new behavior, new data, or a new user-facing
  capability — not only when the user explicitly says "new feature" or types /new-feature.
  Also invoke it directly whenever the user names it. Skip the full workflow only
  for trivial bugfixes or pure UI/style tweaks that add no new behavior —
  everything else, including anything touching data, auth, money, or
  business logic, goes through the full workflow: mandatory clarifying
  questions, a persistent /architecture/ knowledge base read and updated
  every time, a mandatory reuse/dedup check, database migrations written as
  a priority with optimized queries, Ponytail-disciplined implementation,
  a mandatory security review, mandatory unit tests, milestone tracking,
  and a GEMINI.md update on completion.
---

# Feature Development

## Why this exists

New features are where scope creep, duplicated logic, missed edge cases,
and forgotten security checks get introduced — not in old code, in the
moment it's written. This skill exists to slow that specific moment down:
ask before assuming, check what already exists before writing more, treat
the database schema and security as first-class steps instead of
afterthoughts, and leave a trail (architecture docs, GEMINI.md) so the next
feature — or the next agent session — doesn't relearn what this one just
learned the hard way.

## Non-negotiables

- Never assume scope, edge cases, or access rules on anything security- or
  data-shape-relevant. Ask (Phase 2). A wrong guess here is expensive to
  unwind after code exists.
- Never write new code before checking whether it already exists in the
  codebase (Phase 3).
- Every feature gets a security pass (Phase 8) and unit tests (Phase 9) —
  no exceptions for "this one's simple," that's exactly the one that gets
  skipped and bites later.
- The architecture knowledge base (Phase 1 read, Phase 11 write) is not
  optional bookkeeping — treat undocumented decisions as decisions that
  didn't happen, because the next session won't know about them.

## Phase 0 — Does the full workflow apply?

**Full workflow** — anything that adds new behavior, new data, a new
endpoint/route, a new UI flow, or touches auth/money/user data.

**Lightweight path** — a pure bugfix with no new behavior, or a pure
visual/style tweak with no new logic. For these: implement directly, skip
the plan doc, architecture-folder update, and milestone tracking. Still
keep the security carve-out in mind (don't let a "quick fix" remove
validation or a permission check), and still run/update tests if you're
touching code that already has coverage.

If genuinely unsure which path applies, say so and default to the full
workflow — the cost of over-process on a small feature is far lower than
the cost of under-process on one that turns out not to be small.

## Phase 1 — Read the architecture knowledge base first

Before anything else, check for a repo-root `/architecture/` folder:

- `overview.md` — stack, major modules, conventions
- `decisions.md` — running log of past architecture decisions and why
- `gotchas.md` — running log of things that broke or almost broke, and why
- `data-model.md` — current schema/entities

If it exists, read all four before planning anything — this is exactly the
information that prevents repeating a past mistake. If it doesn't exist
yet, note that; Phase 11 creates it.

## Phase 2 — Ask clarifying questions (don't assume, recommend a default)

Before scoping the feature, ask the user about anything genuinely
ambiguous: who can access it, expected scale/data volume, edge cases,
whether it touches money/PII/auth, and anything the architecture docs
didn't already answer.

For each question, propose a recommended default based on what Phase 1
and the existing codebase suggest, so the user can confirm quickly instead
of writing an essay — but don't silently proceed on a guessed answer for
anything security- or data-shape-relevant. Keep this tight: the goal is
removing ambiguity that would otherwise cause rework, not interviewing for
its own sake. Record the answers in the tracking doc (template below).

## Phase 3 — Check for existing reusable code first

Before writing anything new, search the codebase for a function,
component, endpoint, or pattern that already does this or something close
enough to extend. Order of preference: reuse as-is > extend what exists >
write new.

If this search surfaces duplication in code you're about to touch or
extend, flag it — don't add a third copy of something already duplicated
twice. (Pairs with the `duplicate-code-refactor` skill if it's available;
run that skill's Phase 1 search logic here rather than skipping straight
to new code.)

## Phase 4 — Write the feature plan

Required unless Phase 0 said lightweight. Cover:

- What the feature does and who can access it
- Data model changes
- API/endpoint surface
- UI states — empty, loading, error, success
- Any numeric threshold/amount/limit it introduces, and whether it's
  configurable or hardcoded (see Phase 7)
- Security surface (what trust boundaries does this cross?)
- Whether a migration is required

This plan becomes Milestone 0 in the tracking doc.

## Phase 5 — Database migration first, and optimized from the start

If the feature needs a schema change, write and verify the migration
**before** the dependent feature code — the schema is the foundation
everything else is built on, not a step to bolt on after.

Optimize at write-time, not in a later pass:

- Add indexes for the access patterns this feature introduces
- Eager-load relationships the feature will need (avoid N+1 by design)
- Keep new queries to the minimum round trips required
- If the project already has a query-count regression test suite, extend
  it to cover the new queries rather than leaving them unverified

Keep the migration itself small, reversible, and independently runnable —
don't bundle it with unrelated schema edits.

## Phase 6 — Implement, Ponytail-disciplined

Apply the ladder before writing feature code — stop at the first rung that
holds:

1. Does this need to exist as new code at all? (YAGNI)
2. Already in this codebase? (Phase 3 answered this — reuse it.)
3. Stdlib does it?
4. Native platform feature covers it?
5. An already-installed dependency solves it?
6. Can it be one line?
7. Only then: the minimum code that works.

No unrequested abstractions — no interface for one implementation, no
factory for one product, no config for a value that'll never change
(exception: values flagged admin-configurable in Phase 7 — that's a
requirement, not scope creep). Mark deliberate simplifications with a
`ponytail:` comment naming the ceiling and what would trigger revisiting
it.

**Never simplify away:** input validation at trust boundaries, error
handling that prevents data loss, security measures, accessibility basics,
or anything the user explicitly asked for. This carve-out is what keeps
Phase 6 and Phase 8 from working against each other.

If the `ponytail` skill is available in the environment, invoke it
directly for this phase — the rules above are the condensed version to
apply if it isn't.

## Phase 7 — Admin-configurability pass

Any numeric threshold, amount, limit, percentage, or business rule this
feature introduces defaults to configurable — a settings table, admin
panel field, or config file — rather than hardcoded. If you do hardcode
one, state the specific reason inline (e.g. a value tied to a fixed
external constraint) rather than defaulting to hardcoding out of
convenience.

## Phase 8 — Security review (every feature, no exceptions)

- **Auth/authorization** — is every new endpoint/action gated correctly?
  Can a non-owner or non-admin reach it?
- **Input validation** at every trust boundary the feature adds.
- **Output encoding** for anything rendered from user input.
- **Rate limiting** if the feature adds a new public-facing write or an
  expensive read.
- **Secrets/PII handling** if the feature touches either.
- Confirm the Phase 6 Ponytail pass didn't simplify away any of the
  above — its own rules should have protected this, but verify rather than
  assume.

## Phase 9 — Unit tests (required, not optional)

Write unit tests for the new logic as part of building the feature, not
as cleanup afterward — cover the core behavior and the edge cases
surfaced in Phase 2. For anything reused or extended from Phase 3, confirm
its existing tests still pass.

## Phase 10 — Track with milestones

Same pattern as `duplicate-code-refactor`: a persistent tracking file so
a multi-session feature doesn't lose state. Milestone 0 is the plan from
Phase 4; each following milestone is one verifiable, revertible
implementation slice (migration, backend logic, UI, tests, security pass).

## Phase 11 — Update the architecture knowledge base

Append to `/architecture/`:

- `decisions.md` — what approach was chosen and why, what alternatives
  were considered
- `gotchas.md` — anything that broke or almost broke while building this,
  and what to check before touching that area again
- `data-model.md` — update if the schema changed
- `overview.md` — update only if this feature changed something
  structural (a new module, a new major dependency)

Create the `/architecture/` folder and these four files if this is the
first feature run through this skill on the project.

## Phase 12 — Update GEMINI.md

Create `GEMINI.md` at the repo root if it doesn't exist yet (template
below); update it if it does. It should reflect what the project is, what
this feature adds, and point at `/architecture/` for the detail — GEMINI.md
stays a short orientation file, the architecture folder holds the depth.

## Phase 13 — Close out

Confirm every milestone from Phase 10 is checked off, the Phase 8
security checklist passed, tests pass, and both `/architecture/` and
`GEMINI.md` are updated. Summarize for the user: what was built, what
migration ran, what got reused vs. written new, what's now
admin-configurable, and anything flagged in gotchas.md for the future.

---

## Templates

### Feature tracking doc (`FEATURE_PLAN_<name>.md`)

```markdown
# Feature: <name>

## Plan (Milestone 0)
- What it does / who can access it: ...
- Data model changes: ...
- API/endpoint surface: ...
- UI states: empty / loading / error / success
- New configurable values introduced: ...
- Security surface: ...
- Migration required: yes/no — <summary>

## Clarifying answers (Phase 2)
- Q: ... → A: ... (recommended default was: ...)

## Milestones
- [x] Milestone 0 — plan written & confirmed
- [ ] Milestone 1 — migration written + optimized queries verified
- [ ] Milestone 2 — backend logic implemented (Ponytail pass done)
- [ ] Milestone 3 — UI implemented
- [ ] Milestone 4 — unit tests written & passing
- [ ] Milestone 5 — security checklist passed
- [ ] Milestone 6 — architecture docs + GEMINI.md updated

## Security checklist (Phase 8)
- [ ] Auth/authorization gated correctly
- [ ] Input validation at trust boundaries
- [ ] Output encoding for user-rendered input
- [ ] Rate limiting (if applicable)
- [ ] Secrets/PII handled correctly
- [ ] Ponytail pass didn't simplify away any of the above
```

### `/architecture/decisions.md` entry

```markdown
## <date> — <feature name>: <decision title>
Chose: <approach>
Because: <reason>
Alternatives considered: <...>
```

### `/architecture/gotchas.md` entry

```markdown
## <date> — <short title>
What broke / almost broke: ...
Root cause: ...
Check before touching <area> again: ...
```

### `GEMINI.md` starter

```markdown
# <Project Name>

## What this is
<one-paragraph description>

## Stack
<languages / frameworks>

## Conventions
See /architecture/overview.md for structure and rules agents should
follow.

## Features
- <feature> — added <date>, see /architecture/decisions.md for why

## Known gotchas
See /architecture/gotchas.md
```

## Anti-patterns to avoid

- Writing feature code before the migration it depends on is finalized.
- Treating the security pass (Phase 8) as a formality on "simple" features.
- Letting Ponytail's minimalism cut into validation, error handling, or
  access checks — the carve-out in Phase 6 exists precisely to prevent
  this.
- Hardcoding a threshold/amount out of convenience instead of flagging it
  configurable.
- Finishing a feature without touching `/architecture/` or `GEMINI.md` —
  the next feature (or next session) then starts from zero again.
