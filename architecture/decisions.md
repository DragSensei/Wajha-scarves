# Architectural Decisions Log

## 2026-08-06 — Product Details & Care Instructions Fields
**Chose**: Text column storage in `product` table (`details`, `care_instructions`) with line-by-line bullet parsing on storefront UI.
**Because**: Lightweight, robust across SQLite and Neon Postgres, easily editable via multi-line textareas without complex rich-text or JSON array dependencies.
**Alternatives considered**: JSON array columns (adds unnecessary schema overhead for simple lists), Rich Text / HTML editor (introduces security/sanitization surface).
