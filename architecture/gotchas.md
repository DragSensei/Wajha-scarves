# System Gotchas and Lessons Learned

## 2026-08-06 — Product Details & Care Instructions
- **Alembic autogenerate requirement**: Always add model attributes to `api/core/models.py` *before* running `flask db migrate`, or autogenerate won't detect new table columns.
- **Frontend Bullet Parsing**: Clean leading bullet characters (`•`, `-`, `*`) in `ProductDetails.jsx` so admin users can paste either raw text or pre-bulleted lists without doubling bullet icons.

## 2026-08-09 — Windows Console Unicode Output & Serverless Threads
- **Unicode Safety in Python Print**: Avoid raw emoji printing in server background logs on Windows (e.g. `✨`) without encoding fallbacks to prevent `charmap` codec exceptions on `cp1252` terminal streams.
- **React Effect State Updates**: Do not invoke `setState` synchronously within component `useEffect` callbacks; use clean promises or mounted flag patterns to pass strict ESLint checks.

