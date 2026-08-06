# Data Model Schema Reference

## Product Table (`product`)
- `id` (INTEGER, Primary Key)
- `name` (VARCHAR(150), Unique, Not Null)
- `price` (FLOAT, Not Null)
- `description` (TEXT, Nullable)
- `details` (TEXT, Nullable) — New: Multi-line product specification bullet points
- `care_instructions` (TEXT, Nullable) — New: Multi-line care instruction bullet points
- `category` (VARCHAR(50), Default 'unclassified')
- `category_id` (INTEGER, Foreign Key to `category.id`, Nullable)
- `image_filename` (VARCHAR(255), Nullable)
- `stock` (INTEGER, Default 0, Not Null)
- `created_at` (DATETIME, Default UTC Now)
