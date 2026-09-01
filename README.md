# ROOST — Hostel & Co-Living Management Backend

Enterprise-grade Node.js / Express backend with Multi-tenant architecture, PostgreSQL (Prisma ORM), Role-Based Access Control (RBAC), and full RESTful API suite for hostel operations.

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Module Structure](#module-structure)
3. [Environment Setup & Running](#environment-setup--running)
4. [Postman Testing Guide](#postman-testing-guide)
5. [Complete API Reference](#complete-api-reference)
6. [RBAC & Permissions Matrix](#rbac--permissions-matrix)

---

## 1. Architecture Overview

- **Framework**: Express.js 5.2.1
- **Database**: PostgreSQL (AWS RDS) with `@prisma/client` and `@prisma/adapter-pg`
- **Authentication**: JWT (JSON Web Tokens) with standard claims (`userId`, `role`, `tenantId`)
- **Password Security**: Bcrypt (10 rounds)
- **Validation**: Zod schema validation middleware
- **Audit Logging**: Automatic structured audit log records for all mutating operations (`audit_logs` table)
- **Standard API Envelope**:
  - **Success Response**: `{ "success": true, "data": { ... } }`
  - **Error Response**: `{ "success": false, "code": "ERROR_CODE", "message": "Human readable message" }`

---

## 2. Module Structure

| Module | Base Path | Key Capabilities |
|---|---|---|
| **Auth** | `/api/v1/auth` | Register, Login, Admin Login, Profile (`GET/PATCH /me`), Forgot Password, Change Password |
| **Guests** | `/api/v1/roost/guests` | Full Guest profiles, ID proof metadata (Aadhaar, Passport, etc.), Search & List |
| **Bookings & Beds** | `/api/v1/roost/bookings`, `/api/v1/roost/beds` | Room & Bed availability, Direct Bookings, Check-In, Check-Out, Booking Cancellation |
| **Finance** | `/api/v1/roost/payments`, `/api/v1/roost/invoices`, `/api/v1/roost/refunds` | Payment collection (CASH, UPI, CARD, BANK), Invoices generation, Refund request & Approvals |
| **Experience** | `/api/v1/roost/complaints`, `/api/v1/roost/feedback` | Maintenance & service complaints lifecycle, Multi-factor Guest ratings & feedback summaries |
| **Management** | `/api/v1/roost/staff`, `/api/v1/roost/inventory` | Staff creation (Managers, Receptionists, Staff), Staff performance, Inventory stock tracking |
| **Analytics & BI** | `/api/v1/roost/analytics` | Real-time Operations Dashboard, Weekly & Monthly BI revenue & occupancy metrics |
| **System** | `/api/v1/roost/settings`, `/api/v1/roost/audit-logs`, `/api/v1/roost/access-control` | Hostel configuration, RBAC permissions, Security Audit Logs, Camera config |

---

## 3. Environment Setup & Running

### Prerequisites
- Node.js v18+ (v22 recommended)
- PostgreSQL database

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (`.env`)
```env
PORT=5000
DATABASE_URL="postgresql://postgres:password@your-db-host:5432/roost?sslmode=no-verify"
JWT_SECRET=your-super-secret-roost-key
```

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Start the Server
```bash
# Production mode
npm start

# Development mode (with nodemon)
npm run dev
```
Server runs by default at `http://localhost:5000/api/v1`.

---

## 4. Postman Testing Guide

We have included a complete Postman Collection file in the root directory: **`postman_collection.json`**.

### How to Import into Postman:
1. Open **Postman**.
2. Click **Import** (top left).
3. Drag & drop or select `postman_collection.json` from this project folder.
4. You will see the **ROOST Hostel Management API Collection** with 8 structured folders.

### Environment & Collection Variables:
The collection includes pre-configured variables:
- `baseUrl`: `http://localhost:5000/api/v1` (change to your EC2 URL `http://13.51.13.251:5000/api/v1` when testing remotely)
- `token`: Automatically captured upon successful login!
- `guestId`, `propertyId`, `roomId`, `bedId`, `bookingCode`, `paymentId`, `complaintId`, `itemId`, `staffId`

### Recommended Step-by-Step Testing Flow:

#### Step 1: Authentication & Token Generation
1. Run **`1. Authentication & Profile -> 1.2 Login`** (or `1.3 Admin Login`).
2. The Test Script in Postman automatically extracts `accessToken` and saves it to `{{token}}`.
3. Test **`1.4 Get Profile (GET /auth/me)`** to verify your authentication identity.
4. Test **`1.5 Update Profile (PATCH /auth/me)`** to change name or phone.

#### Step 2: Register a Guest & Allocate a Bed
1. Run **`2. Reception - Guests -> 2.3 Register Guest`** to create a guest record with ID proof details.
2. Run **`3. Reception - Bookings & Beds -> 3.6 List Beds`** to check available beds.
3. Run **`3.2 Create Booking`** with the `guestId`, `propertyId`, `roomId`, and `bedId`.
4. Copy the returned `bookingCode` into collection variable `{{bookingCode}}`.

#### Step 3: Check-In & Collect Payment
1. Run **`3.3 Check-In Guest`** (`PATCH /roost/bookings/:code/check-in`). The bed status becomes `OCCUPIED`.
2. Run **`4. Finance & Payments -> 4.2 Collect Payment`** with `bookingId` and amount.
3. Run **`4.4 List Invoices`** and **`4.5 Get Invoice By Booking`** to view the auto-generated tax invoice.

#### Step 4: Guest Experience (Complaints & Feedback)
1. Run **`5. Guest Experience -> 5.2 Create Complaint`** (e.g. AC Maintenance).
2. Run **`5.3 Update Complaint`** to change status to `RESOLVED` with resolution notes.
3. Run **`5.5 Submit Feedback`** to rate cleanliness, staff service, and value.
4. Run **`5.6 Feedback Summary`** to view aggregate star ratings.

#### Step 5: Staff & Inventory Management
1. Run **`6. Management & Staff -> 6.2 Create Staff`** to add a new `RECEPTIONIST` or `MANAGER`.
2. Run **`6.4 Staff Performance`** to view check-in/out and payment collection counts per staff member.
3. Run **`6.6 Create Inventory Item`** to add hostel supplies (linen, towels, cleaning supplies).
4. Run **`6.8 Inventory Summary`** to see total items, low stock alerts, and inventory value.

#### Step 6: BI & Operations Analytics
1. Run **`7. Analytics & BI -> 7.1 Dashboard`** to get real-time occupancy, revenue, today's check-ins/outs, and bed breakdown (AC / Non-AC).
2. Run **`7.2 Weekly BI`** and **`7.3 Monthly BI`** to get day-by-day revenue trends.

---

## 5. Complete API Reference Table

### Auth & User (`/api/v1/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/auth/register` | Register new guest/user | Public |
| `POST` | `/auth/login` | Login and obtain JWT access token | Public |
| `POST` | `/auth/admin/login` | Platform Admin login | Public |
| `GET` | `/auth/me` | Fetch authenticated user profile | Authenticated |
| `PATCH` | `/auth/me` | Update authenticated user profile | Authenticated |
| `POST` | `/auth/forgot-password` | Password reset trigger | Public |
| `POST` | `/auth/change-password` | Change user password | Authenticated |

### Guests (`/api/v1/roost/guests`)
| Method | Endpoint | Description | Permission |
|---|---|---|---|
| `GET` | `/roost/guests` | Search and filter guest list | `guests:read` |
| `GET` | `/roost/guests/:id` | Get guest details, bookings, & payments | `guests:read` |
| `POST` | `/roost/guests` | Register guest with ID proof | `guests:write` |
| `PATCH` | `/roost/guests/:id` | Update guest contact/profile info | `guests:write` |

### Bookings & Beds (`/api/v1/roost/bookings`, `/api/v1/roost/beds`)
| Method | Endpoint | Description | Permission |
|---|---|---|---|
| `GET` | `/roost/bookings` | List all bookings with search/status filters | `reception:operate` |
| `POST` | `/roost/bookings` | Create new confirmed booking | `reception:operate` |
| `PATCH` | `/roost/bookings/:code/check-in` | Check in guest & mark bed OCCUPIED | `reception:operate` |
| `PATCH` | `/roost/bookings/:code/check-out` | Check out guest & free bed | `reception:operate` |
| `PATCH` | `/roost/bookings/:code/cancel` | Cancel booking | `reception:operate` |
| `GET` | `/roost/beds` | List beds with AC/Non-AC filter | `reception:operate` |
| `GET` | `/roost/beds/availability` | Check bed availability | `reception:operate` |

### Finance (`/api/v1/roost/payments`, `/api/v1/roost/invoices`, `/api/v1/roost/refunds`)
| Method | Endpoint | Description | Permission |
|---|---|---|---|
| `GET` | `/roost/payments` | List payments (scoped to guest if GUEST) | `finance:read` |
| `GET` | `/roost/payments/:id` | Get payment details by ID | `finance:read` |
| `GET` | `/roost/invoices` | List invoices by property | `finance:read` |
| `GET` | `/roost/invoices/:bookingId` | Get invoice for specific booking | `finance:read` |
| `GET` | `/roost/refunds` | List refunds by status | `finance:read` |
| `POST` | `/roost/refunds` | Request refund for a payment | `finance:collect` |
| `PATCH` | `/roost/refunds/:id/approve` | Approve refund request | `finance:refund:approve` |
| `PATCH` | `/roost/refunds/:id/reject` | Reject refund request | `finance:refund:approve` |

### Guest Experience (`/api/v1/roost/complaints`, `/api/v1/roost/feedback`)
| Method | Endpoint | Description | Permission |
|---|---|---|---|
| `GET` | `/roost/complaints` | List complaints (scoped to guest if GUEST) | `experience:read` |
| `POST` | `/roost/complaints` | File a new complaint | `experience:write` |
| `PATCH` | `/roost/complaints/:id` | Update complaint status & resolution | `experience:manage` |
| `GET` | `/roost/feedback` | List feedback reviews | `experience:read` |
| `POST` | `/roost/feedback` | Submit rating & review | `experience:write` |
| `GET` | `/roost/feedback/summary` | Get aggregate rating statistics | `reports:read` |

### Management & Staff (`/api/v1/roost/staff`, `/api/v1/roost/inventory`)
| Method | Endpoint | Description | Permission |
|---|---|---|---|
| `GET` | `/roost/staff` | List staff members (Manager, Receptionist, Staff) | `users:read` |
| `POST` | `/roost/staff` | Create new staff user | `users:manage` |
| `PATCH` | `/roost/staff/:id` | Update staff details / role / status | `users:manage` |
| `GET` | `/roost/staff/performance` | Metrics: check-ins, check-outs, collections | `reports:read` |
| `GET` | `/roost/inventory` | List inventory stock items | `inventory:read` |
| `POST` | `/roost/inventory` | Create new inventory item | `inventory:manage` |
| `PATCH` | `/roost/inventory/:itemId` | Update min stock / cost per unit | `inventory:manage` |
| `DELETE` | `/roost/inventory/:itemId` | Delete/deactivate inventory item | `inventory:manage` |
| `GET` | `/roost/inventory/summary` | Summary: total items, low stock, total valuation | `inventory:read` |

### Analytics & Reports (`/api/v1/roost/analytics`)
| Method | Endpoint | Description | Permission |
|---|---|---|---|
| `GET` | `/roost/analytics/dashboard` | Real-time hostel dashboard metrics | `reports:read` |
| `GET` | `/roost/analytics/weekly` | Last 7 days revenue and occupancy | `reports:read` |
| `GET` | `/roost/analytics/monthly` | Last 30 days revenue and occupancy | `reports:read` |
| `GET` | `/roost/analytics/bi` | Aggregated BI reports (Revenue, Complaints, Feedback) | `reports:read` |

### System & Settings (`/api/v1/roost/settings`, `/api/v1/roost/access-control`, `/api/v1/roost/audit-logs`)
| Method | Endpoint | Description | Permission / Role |
|---|---|---|---|
| `GET` | `/roost/settings` | Get hostel settings (flat format) | `settings:read` |
| `PATCH` | `/roost/settings` | Update hostel settings | `settings:write` |
| `GET` | `/roost/access-control/permissions` | View RBAC permission matrix | `PLATFORM_ADMIN`, `ADMIN` |
| `PATCH` | `/roost/access-control/permissions` | Update runtime role permissions | `PLATFORM_ADMIN`, `ADMIN` |
| `GET` | `/roost/audit-logs` | View chronological system audit trail | `audit:read` |

---

## 6. RBAC & Permissions Matrix

| Role | Permissions |
|---|---|
| `PLATFORM_ADMIN` / `ADMIN` | Full Wildcard `["*"]` — All endpoints |
| `OWNER` | Properties, Rooms, Beds, Bookings, Reception, Finance, Users, Inventory, Experience, Reports, Settings, Audit |
| `MANAGER` | `properties:read`, `rooms:read`, `beds:read`, `reception:operate`, `guests:read`, `guests:write`, `finance:collect`, `finance:read`, `users:read`, `users:manage`, `inventory:read`, `inventory:manage`, `experience:read`, `experience:write`, `experience:manage`, `reports:read`, `settings:read`, `audit:read` |
| `RECEPTIONIST` | `properties:read`, `rooms:read`, `beds:read`, `reception:operate`, `guests:read`, `guests:write`, `finance:collect`, `finance:read`, `inventory:read`, `experience:read`, `experience:write`, `reports:read` |
| `STAFF` | `properties:read`, `rooms:read`, `beds:read`, `inventory:read`, `experience:read`, `experience:write` |
| `GUEST` | `guests:read`, `experience:read`, `experience:write`, `finance:read` (strictly scoped to own guest records) |
