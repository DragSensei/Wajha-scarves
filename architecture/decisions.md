# Architectural Decisions Log

## 2026-08-06 — Product Details & Care Instructions Fields
**Chose**: Text column storage in `product` table (`details`, `care_instructions`) with line-by-line bullet parsing on storefront UI.
**Because**: Lightweight, robust across SQLite and Null-safe Neon Postgres, easily editable via multi-line textareas without complex rich-text or JSON array dependencies.
**Alternatives considered**: JSON array columns (adds unnecessary schema overhead for simple lists), Rich Text / HTML editor (introduces security/sanitization surface).

## 2026-08-09 — Newsletter System & 12-Row Pagination Architecture
**Chose**: Dedicated `NewsletterSubscriber` database model with strict 12-row pagination (`per_page = 12`) and non-blocking background thread broadcast campaign dispatch.
**Because**: Saves database query payload sizes on Vercel Serverless / Neon Postgres while preventing serverless timeouts during bulk campaign dispatch.
**Alternatives considered**: Synchronous bulk mailing in single request (prone to serverless timeouts), unpaginated full subscriber queries (high DB memory overhead).

