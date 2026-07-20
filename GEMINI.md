# Diya (formerly Wajha Scarves) - Project Architecture and Boundaries

This repository is structured around a strict **feature-based architecture** and **one-way data flow** constraints for both the React frontend client and the Flask backend server.

---

## 1. Folder Structure

### Client (React Frontend)
The frontend directories live directly at the root of the project:
```
project/
├── app/                      # Entry point, routing, and global style imports (orchestration only)
├── shared/                   # Non-feature-specific common code
│   ├── components/           # Generic buttons, inputs, modals, layouts
│   ├── lib/                  # Library wrappers (API fetch wrappers)
│   ├── api/                  # Base API client configuration
│   └── utils/                # Date/number formatters and helper utils
└── features/                 # Domain-specific business logic
    ├── auth/                 # Login, register, session APIs and forms
    ├── authorization/        # Access guards and role-based wrappers
    ├── products/             # Scarf catalog, detail pages, grid listing
    ├── categories/           # Filter tabs and product categorization
    ├── cart/                 # Cart list, drawer, and checkout trigger
    └── admin/                # Admin panels, CRUD modals, and dashboard orchestration
```

*Every feature folder inside `features/<name>/` contains:*
- `components/` - Private UI components for this feature.
- `schemas/` - Validation logic (e.g. Zod or custom validator schemas).
- `server/` - Feature-specific backend API calls.

### Server (Flask Backend)
The backend directories live under the `api/` folder:
```
project/
└── api/
    ├── core/                 # Shared infrastructure (database setup and models)
    │   ├── db.py             # Database connection setup
    │   └── models.py         # Relational database models (SQLAlchemy)
    ├── features/             # Mirroring the client's feature structure
    │   ├── auth/
    │   ├── authorization/
    │   ├── products/
    │   ├── categories/
    │   ├── cart/
    │   └── admin/
    ├── __init__.py           # Flask app factory (create_app)
    └── index.py              # Vercel entrypoint (orchestration only)
```

*Every server feature folder inside `api/features/<name>/` contains:*
- `__init__.py` - Feature blueprint declaration.
- `routes.py` - HTTP request route handlers only (controllers).
- `services.py` - Core business logic, queries, and database mutations.
- `schemas.py` - Payload validation functions and schemas.

---

## 2. One-Way Import Rules & Boundaries

To prevent tight coupling and spaghetti code, we enforce strict dependency boundaries:

1. **Features are Isolated**:
   - `auth`, `authorization`, `products`, `categories`, and `cart` must never import code or routes directly from each other's internals.
   - Any dependency on another feature must be handled either by:
     - **Client-side orchestration**: Let the `app/` routing/layout layer render and coordinate components.
     - **Server-side composition**: Let the `admin/` feature orchestrate services from the other features.
     - **Shared/Core layer**: Move common logic/models into `shared/` (client) or `api/core/` (server).
2. **Admin Exceptions**:
   - The `admin/` feature on the server is allowed to import from the other features' services to compose dashboard statistics or coordinate operations. No other feature can ever import from `admin`.
3. **Core/Shared Imports**:
   - All features are allowed to import from `shared/` (client) or `api/core/` (server).
   - Code inside `shared/` (client) can only import from other `shared/` modules.

---

## 3. Database Schema Models Location

All SQLAlchemy relational models reside centrally inside [models.py](file:///c:/Project/Wajha%20Technologies/Wajha%20Scarves/api/core/models.py). 

**Why?**
Relational database tables heavily reference each other via Foreign Keys and SQLAlchemy relationships (e.g., `Product` belongs to `Category`, `CartItem` references `User` and `Product`, `OrderItem` joins `Order` and `Product`). Splitting models feature-by-feature leads to complex circular imports and database migration issues. Centralizing the relational schema in `api/core/models.py` keeps the database structure in a single source of truth while feature isolation is maintained at the services/routes layers.

---

## 4. How to Run Boundary Checks

We enforce these boundary rules using automated tooling in both the client and server.

### Client-Side Boundaries (ESLint)
Uses `eslint-plugin-boundaries` to enforce import limits.
To run the check:
```bash
npm run lint
```

### Server-Side Boundaries (Import Linter)
Uses `import-linter` to check module dependencies against `.importlinter`.
To run the check:
```bash
# Ensure dependencies are installed
pip install -r requirements.txt

# Run the linter
import-linter lint

```

---

## 5. Database Setup, Migrations & Environment Configuration

### Neon Postgres & Database Fallback
- **Production**: The application utilizes Neon Postgres. It reads the database connection string from the `DATABASE_URL` environment variable.
- **Local Fallback**: If the `DATABASE_URL` environment variable is not defined, the backend automatically falls back to a local SQLite database (`app.db`) stored in the project root.

> [!IMPORTANT]
> **Manual Action Required**: You must provision the Neon Postgres database and link it to the Vercel project via the Vercel dashboard / Neon integration to obtain the `DATABASE_URL` connection string. This cannot be automated by the agent.

### Schema Migrations (Flask-Migrate/Alembic)
Instead of using unsafe `db.create_all()` calls during serverless starts, we manage the schema using Alembic:
1. **Initialize Migration Directory** (completed):
   ```bash
   python -m flask --app api db init
   ```
2. **Generate a Migration Script**:
   Whenever SQLAlchemy models in `api/core/models.py` change, run:
   ```bash
   python -m flask --app api db migrate -m "Describe changes here"
   ```
3. **Apply Migrations Locally**:
   ```bash
   python -m flask --app api db upgrade
   ```

### Vercel Environment Variables
Set the following environment variables in the Vercel dashboard:
- `DATABASE_URL`: Connection string to the Neon Postgres database.
- `SECRET_KEY`: Long, random key for session signature security.
- `JWT_SECRET`: Random secret key for signing JWT tokens.
- `ADMIN_PASSWORD`: Default password for bootstrapping the administrative panel.
- `CORS_ORIGIN`: Comma-separated list of allowed frontend origins (e.g. `https://yourdomain.vercel.app`).
- `AUTH_MODE`: Set to `local` to enable local JWT authentication.
- `SESSION_COOKIE_SECURE`: Set to `True` to enforce HTTPS cookies.

---

## 6. Cart Persistence & Modest Order Boundaries

### Cart Persistence Strategy
- **Logged-Out Cart**: Managed fully client-side inside the browser's `localStorage` under `diya_cart`.
- **Logged-In Cart**: Persistent in the database via the `CartItem` table.
- **Cart Sync on Login**: When a user logs in successfully, any local cart items are merged into their database cart. If the same item exists in both, their quantities are added together. The local cart is then cleared.
- **Order Placement**: Placing an order clears the database cart for logged-in users, or the local storage cart for guests.

### Order History & Sibling Independence
To show a customer their order history on the Profile page while complying with the strict `Core Feature Independence` constraint (which prevents features like `auth` and `cart` from importing each other):
- The order query service `get_orders_by_email` and the customer route `GET /api/orders/my-orders` are housed entirely inside the `cart` feature package.
- The client-side React code in `ProfilePage` fetches this information directly from `/api/orders/my-orders`. No cross-feature Python imports are executed, satisfying all boundary contracts.


