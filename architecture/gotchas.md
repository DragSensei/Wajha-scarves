# System Gotchas and Lessons Learned

## 2026-08-06 — Product Details & Care Instructions
- **Alembic autogenerate requirement**: Always add model attributes to `api/core/models.py` *before* running `flask db migrate`, or autogenerate won't detect new table columns.
- **Frontend Bullet Parsing**: Clean leading bullet characters (`•`, `-`, `*`) in `ProductDetails.jsx` so admin users can paste either raw text or pre-bulleted lists without doubling bullet icons.
