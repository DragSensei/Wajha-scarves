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
    ├── landing/              # Brand landing page, couture hero, and store entry point
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
- `BLOB_READ_WRITE_TOKEN`: Read/write access token for Vercel Blob storage (enables persistent cloud image uploads across serverless lambdas).

---

## 6. Image Storage & Product Media Management

### Vercel Blob Integration
- **Serverless Ephemeral Storage Fallback**: On Vercel serverless environments, local disk storage is read-only or ephemeral. Image uploads use Vercel Blob storage when `BLOB_READ_WRITE_TOKEN` is configured.
- **Image Processing**: Uploaded product images are automatically validated (max 35MP safety limit), converted to RGB, and compressed as high-quality JPEGs before being stored in Vercel Blob.
- **Image Serialization**: `serialize_product` prioritizes `ProductImage` database gallery records over legacy `product.image_filename` columns.
- **Admin Image Operations**: Admin interface supports multi-image upload, setting primary image (`PUT /api/products/<id>/images/<id>/primary`), and deleting individual images (`DELETE /api/admin/images/<id>`).

---

## 7. Cart Persistence & Modest Order Boundaries

### Cart Persistence Strategy
- **Logged-Out Cart**: Managed fully client-side inside the browser's `localStorage` under `diya_cart`.
- **Logged-In Cart**: Persistent in the database via the `CartItem` table.
- **Cart Sync on Login**: When a user logs in successfully, any local cart items are merged into their database cart. If the same item exists in both, their quantities are added together. The local cart is then cleared.
- **Order Placement**: Placing an order clears the database cart for logged-in users, or the local storage cart for guests.

### Order History & Sibling Independence
To show a customer their order history on the Profile page while complying with the strict `Core Feature Independence` constraint (which prevents features like `auth` and `cart` from importing each other):
- The order query service `get_orders_by_email` and the customer route `GET /api/orders/my-orders` are housed entirely inside the `cart` feature package.
- The client-side React code in `ProfilePage` fetches this information directly from `/api/orders/my-orders`. No cross-feature Python imports are executed, satisfying all boundary contracts.

---

## 8. Image Upload & Dual-Layer Compression Architecture

Image uploads implement a dual-layer compression strategy to optimize network bandwidth and server storage:

### Client-Side Pre-processing (Browser)
- **Utility**: `shared/utils/imageCompressor.js` (`compressImage`)
- **Flow**: Intercepts file inputs in `ProductFormAdmin.jsx` prior to API transmission.
- **Behavior**: Resizes images to maximum `1920 × 1080` resolution maintaining aspect ratio using HTML5 `<canvas>`, exporting JPEG format at `80%` quality (`quality = 0.8`).
- **Purpose**: Dramatically reduces request payload size transmitted over the network.

### Server-Side Processing & Safety (Flask / Pillow)
- **Service**: `api/features/products/services.py` (`process_and_save_image`)
- **Security Guard**: Enforces a 35 Megapixel upper limit (`Image.MAX_IMAGE_PIXELS = 35000000`) to prevent decompression bomb DoS attacks.
- **Normalization**: Converts non-RGB color spaces (RGBA PNG transparency, CMYK) into standard `RGB`.
- **Backend Downscaling & Compression**: Re-verifies resolution cap at `1920 × 1080` using Lanczos resampling and exports optimized JPEG at `85%` quality.
- **Storage Strategy**: Saves to Vercel Blob storage when `BLOB_READ_WRITE_TOKEN` is set; falls back gracefully to local disk (`uploads/` or system `/tmp`).

---

## 10. Digital Gift Vouchers & Birthday Loyalty Architecture

### Digital Gift Vouchers System
- **Denominations**: Fixed options of 100, 200, 500, 1000, and 2000 EGP.
- **Data Model**: Extended `GiftCard` in `api/core/models.py` with `buyer_id`, `buyer_email`, `recipient_name`, `recipient_email`, `gift_message`, and order workflow `status` (`'pending'`, `'contacted'`, `'done'`).
- **Feature Package**: `api/features/vouchers/` provides blueprint endpoints:
  - `POST /api/vouchers/buy`: Validate payload & record purchase request.
  - `GET /api/vouchers/my-vouchers`: Fetch user's digital gift cards.
  - `GET /api/vouchers/admin`: Fetch all voucher orders for administration.
  - `PUT /api/vouchers/admin/<id>/status`: Update voucher status (`pending` → `contacted` → `done`).
- **Frontend Pages & Components**:
  - `VoucherPurchasePage.jsx` (`/vouchers`): Customization form with live preview and instant 1-click code copying.
  - `MyVouchersList.jsx`: Rendered on user Profile page.
  - `AdminVouchersManager.jsx` (`/admin/vouchers`): Filterable order status table for admin fulfillment.

### Birthday Loyalty Points & Tier Qualification Logic
- **Dual-Reward Issuance**: `issue_birthday_rewards()` in `api/features/loyalty/services.py` issues both a percentage discount voucher (`birthday_bonus`) and loyalty points (`birthday_points`).
- **Timezone Boundary Handling**: Compares birthdates against both UTC and local server dates to prevent midnight boundary missed rewards.
- **Tier Spend Thresholds**: Users meeting a tier's `spend_threshold` receive their tier-specific `birthday_reward` points; users below the threshold receive the default fallback points setting (150 pts).
- **Automatic Status Check Sync**: `get_user_loyalty_status()` triggers `issue_birthday_rewards(target_user_id)` so qualified users visiting their profile or rewards page on their birthday receive points instantly.

---

## 11. CallMeBot WhatsApp Order & Voucher Notifications

### Status & Functionality
- **Current Status**: **Fully Functional** (System implementation complete; pending owner's WhatsApp phone number & CallMeBot API key input in Admin Settings).

### Architecture & Implementation
- **Service Integration**: Utilizes CallMeBot's WhatsApp HTTP API (`https://api.callmebot.com/whatsapp.php`) to send free instant notifications directly to the site owner's mobile device upon checkout.
- **Asynchronous & Fail-Safe Dispatch**: `send_callmebot_whatsapp()` in `api/core/utils.py` executes HTTP requests inside a daemon thread (`threading.Thread`). External gateway slowdowns or downtime will never block or fail customer order creation or gift card purchases.
- **Egyptian & International Phone Normalization**: Automatically sanitizes input numbers and converts local Egyptian mobile formats (`010xxxxxxxx`) into standard E.164 international format (`+2010xxxxxxxx`).
- **Notification Triggers**:
  - **Physical Product Checkout**: Triggered in `api_create_order()` (`api/features/cart/routes.py`) upon successful database transaction commit. Sends order ID, customer name, phone, items summary, and total amount in EGP.
  - **Digital Gift Card Purchase**: Triggered in `purchase_voucher()` (`api/features/vouchers/services.py`) upon successful voucher creation. Sends voucher code, value in EGP, buyer email, recipient name, and gift message.
- **Admin Configuration & Test Endpoint**:
  - Whitelisted settings: `callmebot_enabled`, `callmebot_phone`, `callmebot_apikey`.
  - `POST /api/admin/settings/test-callmebot` route in `api/features/admin/routes.py` allows admins to verify credentials and test live delivery directly from the Admin Settings panel (`SettingsAdmin.jsx`).

---

## 12. Newsletter Subscription & Admin Broadcast System

### Customer Footer Subscription
- **Component**: `shared/components/Footer.jsx` with input state, instant email validation, and toast feedback.
- **Endpoint**: `POST /api/newsletter/subscribe` (rate-limited at 10 requests/min).
- **Service**: `subscribe_email(email)` in `api/features/newsletter/services.py`. Prevents duplicates and handles re-subscription gracefully.

### Admin Newsletter Dashboard & 12-Row Pagination
- **Component**: `features/admin/components/NewsletterAdmin.jsx` (`/admin/newsletter`).
- **12-Row Pagination**: Uses a strict 12-row pagination limit (`per_page = 12`) to minimize database query overhead.
- **1-Click Broadcast Campaign**: Includes a 1-click broadcast email composer modal to send campaign emails to all active subscribers or custom-selected rows asynchronously in non-blocking background threads (`threading.Thread`).
- **Admin API Surface**: `GET /api/admin/newsletter`, `POST /api/admin/newsletter/send`, `DELETE /api/admin/newsletter/<id>`.

