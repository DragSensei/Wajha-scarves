# Milestone 2 (M2) Frontend Analysis & UI Design Plan

## Executive Summary
This document presents the detailed frontend analysis and UI design plan for **Milestone 2 (M2: App Settings Whitelist & Admin Tiers Manager)** for the Diya (formerly Wajha Scarves) platform. The analysis covers the existing admin structure, routing architecture, categorized App Settings redesign (`SettingsAdmin.jsx`), proposed `TiersManager.jsx` component, `/admin/tiers` route integration, required API additions, and ESLint import boundary rule compliance.

---

## 1. Existing Admin Structure & Routing Analysis

### 1.1 Folder Organization (`features/admin/`)
The admin feature follows the repository's feature-based architecture and contains:
- `features/admin/components/`:
  - `AdminNavbar.jsx`: Top navigation header for admin layout (displays admin user name, logout button).
  - `Sidebar.jsx`: Collapsible navigation sidebar containing links to all administrative views.
  - `Overview.jsx`: Dashboard cards displaying store sales totals, order counts, product counts, category counts.
  - `ProductsAdmin.jsx` & `ProductFormAdmin.jsx`: Product catalog management and CRUD forms.
  - `CategoriesAdmin.jsx`: Category listing, creation, and modification.
  - `UsersAdmin.jsx`: User management table with pagination.
  - `OrdersAdmin.jsx`: Order logs, status toggling, and customer order detail modal.
  - `SettingsAdmin.jsx`: Store settings management.

### 1.2 App Routing Architecture (`app/App.jsx`)
- **Admin Guard**: Lines 224-228 verify authentication and role (`if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;`).
- **Admin Layout**: Admin routes render within a dedicated flex layout with `Sidebar` and `AdminNavbar`.
- **Existing Routes**:
  - `/admin` -> `<Overview />`
  - `/admin/products` -> `<ProductsAdmin />`
  - `/admin/products/new`, `/admin/products/:id/edit`, `/admin/products/:id/delete` -> `<ProductFormAdmin />`
  - `/admin/categories` -> `<CategoriesAdmin />`
  - `/admin/users` -> `<UsersAdmin />`
  - `/admin/orders` -> `<OrdersAdmin />`
  - `/admin/settings` -> `<SettingsAdmin />`
- **Route Addition Required for M2**:
  - `<Route path="/admin/tiers" element={<TiersManager />} />` in `app/App.jsx`.
  - Navigation menu item `{ name: 'Membership Tiers', path: '/admin/tiers', icon: Crown }` in `features/admin/components/Sidebar.jsx`.

---

## 2. Categorized App Settings Redesign Plan (`SettingsAdmin.jsx`)

### 2.1 Current Settings Inspection
The current `SettingsAdmin.jsx` manages a flat list of form fields:
- `sale_active`, `discount_active`, `discount_percent`, `custom_sale_text`, `discount_categories`, `discount_product_ids`, `whatsapp_number`.

### 2.2 Expanded `ALLOWED_SETTINGS` Whitelist Scope
Backend configuration (`api/__init__.py`) defines 19 allowed settings. We categorize them into 3 logical administrative sections:

| Category | Setting Keys | Description | Input Type |
|---|---|---|---|
| **General & Store Promotions** | `sale_active`, `discount_active`, `discount_percent`, `custom_sale_text`, `discount_categories`, `discount_product_ids`, `whatsapp_number`, `contact_number`, `owner_whatsapp`, `sale_bundle_name` | Store contact info, active site-wide sales, banner texts, category/product discount target selections | Selects, Number inputs, Text inputs, Category pill toggles, Product checkboxes |
| **Loyalty & Points System** | `points_per_egp`, `points_to_egp_rate`, `review_bonus_points`, `social_follow_bonus_points`, `points_expiry_months` | Customer points earning rates per currency unit, point redemption conversion value, reward bonuses, point expiration duration | Numeric inputs with unit labels (e.g. Points / EGP, Months) |
| **Referrals & Vouchers** | `referral_voucher_amount`, `referral_voucher_min_spend`, `referral_min_order_amount`, `voucher_expiry_months` | Referral reward voucher amounts, minimum purchase thresholds for generating and redeeming vouchers, voucher validity | Currency/numeric inputs with minimum spend validation |

### 2.3 UI/UX Design & Layout Structure
`SettingsAdmin.jsx` will be restructured into a **Tabbed Category Workspace**:
1. **Header**: Title "System & App Settings" with quick status indicators and single "Save All Settings" sticky action bar.
2. **Category Tabs**:
   - `[ Store & Promotions ]` `[ Loyalty & Points ]` `[ Referrals & Vouchers ]`
3. **Interactive Control Components**:
   - **Help Tooltips**: Descriptive captions explaining each setting's effect on store mechanics.
   - **Category & Product Pickers**: Retains existing interactive pill badges for categories and filterable checkbox list for targeted items.
   - **Form State Management**: Centralized `settings` state object mapped cleanly to `api.updateSettings(settings)`.
   - **Toast / Status Banner**: Feedback notification for successful updates or validation errors.

---

## 3. `TiersManager.jsx` Component & `/admin/tiers` Plan

### 3.1 Overview & Requirements
The Tier Manager view enables store administrators to configure membership tiers based on lifetime completed-order spend thresholds and monitor customer tier distributions and rankings.

### 3.2 Component Architecture & Layout Design
`TiersManager.jsx` will be structured into three main UI sections:

```
+-----------------------------------------------------------------------+
|  MEMBERSHIP TIERS MANAGER                                             |
|  [ + Add New Tier ] button                                           |
+-----------------------------------------------------------------------+
|  SUMMARY STATS CARDS                                                  |
|  - Total Tiers: 4      - Total Members: 128     - Top Tier: Platinum   |
+-----------------------------------------------------------------------+
|  SECTION A: Membership Tiers Configuration (CRUD Table)               |
|  Ordered by sort_order (Ascending)                                    |
|  Cols: Sort Order | Tier Name | Spend Threshold | Customers | Actions  |
+-----------------------------------------------------------------------+
|  SECTION B: Customer Tier Breakdown & Lifetime Ranking Table          |
|  - Tier Filter Tabs (All / Bronze / Silver / Gold / Platinum)         |
|  - Search by Name/Email                                               |
|  Cols: Rank | Customer Name | Email | Lifetime Spend | Tier Badge    |
+-----------------------------------------------------------------------+
```

### 3.3 Detailed Functional Requirements

#### 1. Tier CRUD Table (`MembershipTier` ordered by `sort_order`):
- **Display**: Table showing all configured tiers ordered by `sort_order` (ascending).
- **Badge Styling**: Unique color themes per tier rank (e.g. Bronze = Warm Amber, Silver = Metallic Slate, Gold = Golden Amber, Platinum = Deep Emerald/Indigo).
- **Sort Order Controls**: Move Up / Move Down buttons or numerical reordering input to easily adjust tier hierarchy.
- **Create / Edit Modal**:
  - Fields:
    - `name` (String, required, e.g. "Silver Tier")
    - `spend_threshold` (Number, minimum completed-order spend to enter tier)
    - `sort_order` (Integer, position rank)
  - Validation: Non-negative spend threshold, unique tier name.
- **Delete Action**: Confirmation prompt with warning if customer accounts are assigned to the tier.

#### 2. Customer Tier Breakdown & Lifetime Ranking Table:
- **Lifetime Spend Calculation**: Sum of `total_amount` for orders where `status === 'completed'`.
- **Ranking Engine**: Ranks customers in descending order of lifetime completed spend.
- **Tier Assignment Mapping**: Customer's tier automatically determined by comparing lifetime spend against tier `spend_threshold` ranges.
- **Search & Filter**: Search box by customer name/email and dropdown/tabs to filter users by assigned tier.
- **Pagination**: Paginated customer list (10-12 users per page) using shared `Pagination` component.

---

## 4. API Layer Enhancements (`shared/lib/api.js`)

To support tier management and extended settings, the `api` object in `shared/lib/api.js` will be augmented with the following methods:

```javascript
// Settings
async getSettings()        // GET /api/settings
async updateSettings(data) // PUT /api/settings (sends whitelist payload)

// Admin Membership Tiers
async getTiers()           // GET /api/admin/tiers -> returns { tiers, stats, user_rankings }
async createTier(tierData) // POST /api/admin/tiers -> creates tier
async updateTier(id, data) // PUT /api/admin/tiers/:id -> updates tier
async deleteTier(id)       // DELETE /api/admin/tiers/:id -> deletes tier
```

*Note: All API methods will include graceful try/catch fallbacks or mock data defaults for offline/development environments.*

---

## 5. ESLint Boundary Rules Compliance Verification

### 5.1 Project Boundary Contracts
As defined in `GEMINI.md` and `.importlinter`:
1. `shared/` can only import from `shared/`.
2. `features/<name>/` can import from `shared/` and its own feature directory, but NEVER from other features.
3. `app/` orchestrates imports from `shared/` and `features/`.

### 5.2 Planned Component Import Audit
- **`TiersManager.jsx`** (`features/admin/components/TiersManager.jsx`):
  - Imports: `react`, `lucide-react`, `@/shared/lib/api`, `@/shared/components/Pagination`, `@/shared/utils/currency`.
  - **Status**: ✅ 100% Compliant (imports only React, third-party icons, and `@/shared/*`).
- **`SettingsAdmin.jsx`** (`features/admin/components/SettingsAdmin.jsx`):
  - Imports: `react`, `lucide-react`, `@/shared/lib/api`.
  - **Status**: ✅ 100% Compliant.
- **`App.jsx`** (`app/App.jsx`):
  - Imports `TiersManager` from `@/features/admin/components/TiersManager`.
  - **Status**: ✅ 100% Compliant.

### 5.3 Automated Boundary Check Results
`npm run lint` was executed across the codebase and returned **0 lint errors or warnings**:
```bash
> wajha-scarves@0.0.0 lint
> eslint .
# Exit Code: 0
```

---

## 6. Implementation Checklist & Recommendations

1. **`SettingsAdmin.jsx` Refactoring**:
   - Implement tabbed layout (`General & Promotions`, `Loyalty & Points`, `Referrals & Vouchers`).
   - Bind all 19 `ALLOWED_SETTINGS` keys to form state and API update handler.
2. **`TiersManager.jsx` Component Creation**:
   - Build CRUD table for `MembershipTier` ordered by `sort_order`.
   - Build customer tier ranking table based on lifetime completed-order spend.
   - Implement tier creation and edit modal forms.
3. **Routing & Navigation Integration**:
   - Add `/admin/tiers` route in `app/App.jsx`.
   - Add "Membership Tiers" link to admin `Sidebar.jsx`.
4. **API Helper Extensions**:
   - Add tier CRUD API methods to `shared/lib/api.js`.
5. **Quality Verification**:
   - Run `npm run lint` to verify zero import boundary violations.
