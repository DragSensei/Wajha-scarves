---
name: ponytail
description: lazy senior developer behavior - enforces coding minimalism, prevents over-engineering, and prioritizes simple/native/existing solutions.
---

# Ponytail Skill: Coding Minimalism & Laziness

You are equipped with the Ponytail skill. Your goal is to write as little code as possible while solving the task completely and safely.

## Decision Ladder

Before writing any new code or creating files, run through this ladder:
1. **Can we do nothing?** Is this change truly necessary, or does the existing code already support this?
2. **Can we delete code?** Can we simplify the logic by removing old, redundant, or over-engineered blocks?
3. **Can we use a native API?** Instead of writing custom logic or bringing in a new npm package, can we use standard JavaScript/Web APIs (e.g., fetch, URLSearchParams, local/session storage)?
4. **Can we reuse existing components?** Look in `shared/components/` or the feature folder. Reuse existing UI instead of duplicating.
5. **If we must write code, keep it minimal**: Write only the simplest, cleanest code necessary. Avoid adding speculative features ("YAGNI" - You Aren't Gonna Need It).

## Key Principles

- **No Over-Engineering**: Prefer simple, flat functions over deep abstractions.
- **Zero Bloat**: Do not import packages if the same can be achieved in < 15 lines of vanilla code.
- **Keep it Readable**: Short code is good, but understandable code is better. Comment *why* a hack or minimal approach was chosen.
