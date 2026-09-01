# ROOST API Reference

This is the API contract implemented by this backend. Base URL: `http://localhost:5000/api/v1`.

## Shared rules

- Protected endpoints require `Authorization: Bearer <JWT>` and JSON requests use `Content-Type: application/json`.
- IDs accept a number or numeric string; database `BigInt` IDs are returned as strings.
- Dates are `YYYY-MM-DD`; timestamps are ISO-8601 strings.
- Success: `{ "success": true, "data": ... }`. Some legacy endpoints add `message`, `items`, or `pagination`.
- Error: `{ "success": false, "code": "VALIDATION_ERROR", "message": "..." }`. Relevant errors are 400 validation/date errors, 401 authentication, 403 authorization, 404 not found, 409 conflict/state errors, and 500 unexpected errors.
- All currently implemented APIs use JSON. There are no multipart or file-upload routes.
- Public platform-admin registration is intentionally unavailable. Provision the first `PLATFORM_ADMIN` through a controlled deployment/database procedure, then create managers and receptionists with `POST /roost/users`.

## Endpoint index

| Method | Path | Auth | Roles / permission | Module |
| --- | --- | --- | --- | --- |
| GET | `/` | No | Public | Service |
| GET | `/api/v1` | No | Public | Service |
| GET | `/api/v1/health` | No | Public | Health |
| POST | `/api/v1/auth/register` | No | Public | Auth |
| POST | `/api/v1/auth/login` | No | Public | Auth |
| GET | `/api/v1/auth/me` | Yes | Signed-in user | Auth |
| POST | `/api/v1/auth/change-password` | Yes | Signed-in user | Auth |
| POST | `/api/v1/auth/admin/login` | No | Platform-admin account | Auth |
| GET | `/api/v1/properties` | No | Public | Properties |
| GET | `/api/v1/properties/mine` | Yes | OWNER, STAFF | Properties |
| GET | `/api/v1/properties/:slug` | No | Public | Properties |
| GET | `/api/v1/properties/:slug/availability` | No | Public | Availability |
| POST | `/api/v1/properties` | Yes | OWNER, STAFF, PLATFORM_ADMIN | Properties |
| PATCH | `/api/v1/properties/:propertyId` | Yes | OWNER, STAFF | Properties |
| PATCH | `/api/v1/properties/:propertyId/status` | Yes | OWNER, STAFF, PLATFORM_ADMIN | Properties |
| DELETE | `/api/v1/properties/:propertyId` | Yes | OWNER, STAFF | Properties |
| GET | `/api/v1/properties/:propertyId/rooms` | Yes | OWNER, STAFF | Rooms |
| POST | `/api/v1/properties/:propertyId/rooms` | Yes | OWNER, STAFF | Rooms |
| PATCH | `/api/v1/rooms/:roomId` | Yes | OWNER, STAFF | Rooms |
| GET | `/api/v1/rooms/:roomId/beds` | Yes | OWNER, STAFF | Beds |
| POST | `/api/v1/rooms/:roomId/beds` | Yes | OWNER, STAFF | Beds |
| PATCH | `/api/v1/beds/:bedId` | Yes | OWNER, STAFF | Beds |
| POST | `/api/v1/bookings` | No | Public | Guest bookings |
| GET | `/api/v1/bookings/:code` | No | Public | Guest bookings |
| PATCH | `/api/v1/bookings/:code/cancel` | No | Public | Guest bookings |
| GET | `/api/v1/bookings` | Yes | OWNER, STAFF, PLATFORM_ADMIN | Bookings |
| GET | `/api/v1/bookings/owner` | Yes | OWNER, STAFF, PLATFORM_ADMIN | Bookings |
| PATCH | `/api/v1/bookings/:code/confirm` | Yes | OWNER, STAFF | Bookings |
| PATCH | `/api/v1/bookings/:code/approve` | Yes | OWNER, STAFF | Bookings |
| PATCH | `/api/v1/bookings/:code/reject` | Yes | OWNER, STAFF | Bookings |
| GET | `/api/v1/analytics/owner-summary` | Yes | OWNER, STAFF | Analytics |
| POST | `/api/v1/reception/guests` | Yes | `guests:write` | Guests |
| GET | `/api/v1/reception/guests` | Yes | `guests:read` | Guests |
| GET | `/api/v1/reception/properties/:propertyId/availability` | Yes | `reception:operate` | Availability |
| POST | `/api/v1/reception/bookings` | Yes | `reception:operate` | Operations bookings |
| PATCH | `/api/v1/reception/bookings/:bookingCode/check-in` | Yes | `reception:operate` | Operations bookings |
| PATCH | `/api/v1/reception/bookings/:bookingCode/check-out` | Yes | `reception:operate` | Operations bookings |
| POST | `/api/v1/finance/payments` | Yes | `finance:collect` | Payments |
| GET | `/api/v1/finance/payments` | Yes | `finance:read` | Payments |
| GET | `/api/v1/finance/invoices/:invoiceNumber` | Yes | `finance:read` | Invoices |
| POST | `/api/v1/finance/refunds` | Yes | `finance:collect` | Refunds |
| PATCH | `/api/v1/finance/refunds/:refundId/decision` | Yes | `finance:refund:approve` | Refunds |
| POST | `/api/v1/management/users` | Yes | `users:manage` | Staff |
| GET | `/api/v1/management/users` | Yes | `users:read` | Users |
| PATCH | `/api/v1/management/users/:userId/status` | Yes | `users:manage` | Users |
| GET | `/api/v1/roost/users` | Yes | PLATFORM_ADMIN, legacy ADMIN | Platform users |
| POST | `/api/v1/roost/users` | Yes | PLATFORM_ADMIN, legacy ADMIN | Create manager/receptionist/user |
| PATCH | `/api/v1/roost/users/:userId` | Yes | PLATFORM_ADMIN, legacy ADMIN | Update user |
| POST | `/api/v1/roost/users/:userId/reset-password` | Yes | PLATFORM_ADMIN, legacy ADMIN | Reset user password |
| PATCH | `/api/v1/roost/users/:userId/activate` | Yes | PLATFORM_ADMIN, legacy ADMIN | Activate user |
| PATCH | `/api/v1/roost/users/:userId/deactivate` | Yes | PLATFORM_ADMIN, legacy ADMIN | Deactivate user |
| POST | `/api/v1/management/inventory/items` | Yes | `inventory:manage` | Inventory |
| GET | `/api/v1/management/inventory/items` | Yes | `inventory:read` | Inventory |
| POST | `/api/v1/management/inventory/items/:itemId/check` | Yes | `inventory:manage` | Inventory |
| GET | `/api/v1/management/inventory/items/:itemId/history` | Yes | `inventory:read` | Inventory |
| POST | `/api/v1/experience/feedback` | Yes | `experience:write` | Feedback |
| GET | `/api/v1/experience/feedback/analysis` | Yes | `experience:read` | Feedback |
| POST | `/api/v1/experience/complaints` | Yes | `experience:write` | Complaints |
| GET | `/api/v1/experience/complaints` | Yes | `experience:read` | Complaints |
| PATCH | `/api/v1/experience/complaints/:complaintId` | Yes | `experience:manage` | Complaints |
| GET | `/api/v1/reports/dashboard` | Yes | `reports:read` | Reports |
| GET | `/api/v1/reports/occupancy` | Yes | `reports:read` | Reports |
| GET | `/api/v1/reports/revenue` | Yes | `reports:read` | Reports |
| GET | `/api/v1/reports/guests` | Yes | `reports:read` | Reports |
| GET | `/api/v1/reports/bookings` | Yes | `reports:read` | Reports |
| GET | `/api/v1/reports/payments` | Yes | `reports:read` | Reports |
| GET | `/api/v1/reports/inventory` | Yes | `reports:read` | Reports |
| GET | `/api/v1/reports/staff-performance` | Yes | `reports:read` | Reports |
| GET | `/api/v1/reports/complaints` | Yes | `reports:read` | Reports |
| GET | `/api/v1/reports/feedback` | Yes | `reports:read` | Reports |
| GET | `/api/v1/reports/bi/weekly` | Yes | `reports:read` | Reports |
| GET | `/api/v1/reports/bi/monthly` | Yes | `reports:read` | Reports |
| GET | `/api/v1/roost/reports/{occupancy,revenue,guests,payments,inventory,complaints,feedback,staff,bookings}` | Yes | `reports:read` | ROOST report aliases |
| GET | `/api/v1/system/access-control` | Yes | Signed-in user | Access control |
| GET | `/api/v1/system/settings` | Yes | `settings:read` | Settings |
| PUT | `/api/v1/system/settings` | Yes | `settings:write` | Settings |
| GET | `/api/v1/system/camera` | Yes | `settings:read` | Cameras |
| PUT | `/api/v1/system/camera` | Yes | `settings:write` | Cameras |
| GET | `/api/v1/system/backup` | Yes | `settings:read` | Backups |
| POST | `/api/v1/system/restore` | Yes | `settings:write` | Backups |
| GET | `/api/v1/system/audit-logs` | Yes | `audit:read` | Audit logs |
| GET | `/api/v1/roost/cameras` | Yes | `PLATFORM_ADMIN`, `ADMIN` | Cameras |
| POST | `/api/v1/roost/cameras` | Yes | `PLATFORM_ADMIN`, `ADMIN` | Cameras |
| PATCH | `/api/v1/roost/cameras/:cameraId` | Yes | `PLATFORM_ADMIN`, `ADMIN` | Cameras |
| DELETE | `/api/v1/roost/cameras/:cameraId` | Yes | `PLATFORM_ADMIN`, `ADMIN` | Cameras |

## Service, health, and auth

### `GET /`, `GET /api/v1`, and `GET /api/v1/health`

**Auth:** none. **Request:** no path/query/body. **Success 200:** the service routes return `{ "success": true, "message": "ROOST API is running", "health": "/api/v1/health" }`; the health route returns `{ "success": true, "status": "ok", "ts": "2026-09-01T00:00:00.000Z" }`.

### `POST /auth/register`

**Auth:** none. **Body:** required `name` (string 2-255), `email` (email), `password` (minimum 12 characters); optional `phone` (10-digit Indian mobile), `tenantId` (numeric ID). **Success 201:** `{ "success": true, "message": "Registered successfully", "data": { "user": { "id": "12", "role": "GUEST" }, "token": "<JWT>" } }`. **Errors:** 400 validation, 409 `EMAIL_EXISTS`.

### `POST /auth/login` and `POST /auth/admin/login`

**Auth:** none. **Body:** required `email` and non-empty `password`. **Success 200:** `{ "success": true, "data": { "user": { "id": "12", "name": "Guest", "role": "GUEST", "tenantId": "1" }, "token": "<JWT>" } }`. The admin login only accepts a `PLATFORM_ADMIN` account. **Errors:** 400 validation, 401 invalid credentials, 403 inactive account.

### `GET /auth/me`

**Auth:** JWT, any role. **Request:** no body. **Success 200:** `{ "success": true, "data": { "id": "12", "name": "Guest", "email": "guest@roost.test", "phone": null, "role": "GUEST", "status": "ACTIVE", "tenantId": "1" } }`. **Errors:** 401, 404.

### `POST /auth/change-password`

**Auth:** JWT, any role. **Body:** required `oldPassword` (non-empty) and `newPassword` (minimum 12 characters). **Success 200:** `{ "success": true, "data": { "message": "Password changed successfully" } }`. **Errors:** 400 invalid old password/validation, 401, 404.

## Properties, rooms, beds, and availability

Property data contains `id`, `tenantId`, `name`, `slug`, address/location fields, `status`, and timestamps. Rooms contain `roomNumber`, optional `floor`, `genderPolicy`, amenities booleans, `basePrice`, and status. Beds contain `bedCode`, `position`, optional `priceOverride`, and status.

### `GET /properties`

**Auth:** none. **Query:** optional `city`, `state`, `search`, `page`, `limit`. **Success 200:** `{ "success": true, "items": [<Property>], "pagination": { "page": 1, "limit": 20, "total": 1 } }`. **Errors:** 400 invalid pagination.

### `GET /properties/mine`

**Auth/role:** JWT; `OWNER` or `STAFF`. **Request:** no body; tenant comes from JWT. **Success 200:** `{ "success": true, "data": [<Property>] }`. **Errors:** 400 `TENANT_REQUIRED`, 401, 403.

### `GET /properties/:slug`

**Auth:** none. **Path:** lowercase property `slug`. **Success 200:** `{ "success": true, "data": <Property> }`. **Errors:** 404.

### `GET /properties/:slug/availability`

**Auth:** none. **Path:** `slug`. **Query:** required `checkIn`, `checkOut` in `YYYY-MM-DD`; check-out must be later. **Success 200:** `{ "success": true, "data": { "rooms": [{ "id": "18", "beds": [{ "id": "32", "isAvailable": true, "price": "600" }] }] } }`. **Errors:** 400 date range, 404.

### `POST /properties`

**Auth/roles:** JWT; `OWNER`, `STAFF`, `PLATFORM_ADMIN`. **Body:** required `name` (2-255), `slug` (2-150, lowercase alphanumeric/dashes); optional `description`, `address`, `city`, `state`, `postalCode`, `latitude` (-90..90), `longitude` (-180..180). JWT tenant is used. **Success 201:** `{ "success": true, "data": <Property> }`. **Errors:** 400, 401, 403, 409 duplicate slug.

### `PATCH /properties/:propertyId` and `PATCH /properties/:propertyId/status`

**Auth/roles:** JWT; update is `OWNER`/`STAFF`, status additionally permits `PLATFORM_ADMIN`. **Path:** numeric `propertyId`. **Update body:** any optional create field except slug. **Status body:** `{ "status": "DRAFT|PUBLISHED|UNPUBLISHED|ARCHIVED" }`. **Success 200:** `{ "success": true, "data": <Property> }`. **Errors:** 400, 401, 403, 404.

### `DELETE /properties/:propertyId`

**Auth/roles:** JWT; `OWNER`, `STAFF`. **Path:** numeric ID. **Success 200:** `{ "success": true, "message": "Property deleted" }`. **Errors:** 401, 403, 404, 409 linked-resource conflict.

### `GET|POST /properties/:propertyId/rooms`

**Auth/roles:** JWT; `OWNER`, `STAFF`. **Path:** numeric `propertyId`. **GET query:** required legacy `tenantId`. **POST body:** required `tenantId`, `roomNumber` (max 50), positive `basePrice`; optional integer `floor`, `genderPolicy` (`MALE|FEMALE|MIXED`), booleans `hasAc`, `hasAttachedBathroom`. **Success:** GET 200 `{ "success": true, "data": [<Room>] }`; POST 201 `{ "success": true, "data": <Room> }`. **Errors:** 400, 401, 403, 404, 409 duplicate room.

### `PATCH /rooms/:roomId`

**Auth/roles:** JWT; `OWNER`, `STAFF`. **Path:** numeric ID. **Body:** required legacy `tenantId`; optional room fields and `status` (`ACTIVE|INACTIVE|MAINTENANCE`). **Success 200:** `{ "success": true, "data": <Room> }`. **Errors:** 400, 401, 403, 404.

### `GET|POST /rooms/:roomId/beds` and `PATCH /beds/:bedId`

**Auth/roles:** JWT; `OWNER`, `STAFF`. **Paths:** numeric IDs. **GET:** required legacy `tenantId` in query (body fallback). **POST:** required `tenantId`, `bedCode` (max 50); optional `position` (`UPPER|LOWER|SINGLE`), positive `priceOverride`. **PATCH:** required `tenantId`; optional bed fields, `priceOverride` may be `null`, `status` is `AVAILABLE|BOOKED|BLOCKED|MAINTENANCE`. **Success:** GET 200 `{ "success": true, "data": [<Bed>] }`; POST 201/PATCH 200 `{ "success": true, "data": <Bed> }`. **Errors:** 400, 401, 403, 404, 409 duplicate/conflict.

## Bookings and analytics

Booking data includes `id`, `bookingCode`, tenant/guest/property/room/bed IDs, stay dates, guest contact data, `source`, `status`, `paymentStatus`, `totalAmount`, and actual check-in/out timestamps.

### `POST /bookings`

**Auth:** none. **Body:** required numeric `tenantId`, `guestId`, `propertyId`, `roomId`, `bedId`; `checkIn`, `checkOut` (`YYYY-MM-DD`); `guestName` (2-255); Indian `guestPhone`. Optional `guestEmail`, `source` (`WEB|WALK_IN|PHONE`, default `WEB`). **Success 201:** `{ "success": true, "message": "Booking created. Awaiting owner confirmation.", "data": <Booking> }`. **Errors:** 400, 404, 409 unavailable/overlapping bed.

### `GET /bookings/:code` and `PATCH /bookings/:code/cancel`

**Auth:** none. **Path:** booking `code`. **Cancel body:** optional `reason`. **Success:** GET 200 `{ "success": true, "data": <Booking> }`; cancel 200 includes cancelled booking. **Errors:** 400, 404, 409 invalid state. **Security note:** the current public cancellation implementation has no ownership check; protect it before exposing it to untrusted clients.

### `GET /bookings` and `GET /bookings/owner`

**Auth/roles:** JWT; `OWNER`, `STAFF`, `PLATFORM_ADMIN`. **Query:** optional `tenantId` fallback, `propertyId`, `status`, `page`, `limit`. **Success 200:** `{ "success": true, "items": [<Booking>], "pagination": { "page": 1, "limit": 20, "total": 1 } }`. **Errors:** 400, 401, 403.

### `PATCH /bookings/:code/confirm`, `/approve`, and `/reject`

**Auth/roles:** JWT; `OWNER`, `STAFF`. `approve` is an alias for confirm. **Path:** booking code. **Confirm/approve body:** optional `tenantId` fallback. **Reject body:** required `reason` (min 5), optional tenant fallback. **Success 200:** `{ "success": true, "data": <Booking> }`. **Errors:** 400, 401, 403, 404, 409 booking transition/bed conflict.

### `GET /analytics/owner-summary`

**Auth/roles:** JWT; `OWNER`, `STAFF`. **Request:** no body/query. **Success 200:** `{ "success": true, "data": { "properties": 1, "rooms": 4, "beds": 12, "bookings": 3, "revenue": "1200.00" } }`. **Errors:** 400 `TENANT_REQUIRED`, 401, 403.

## Reception guests and operations

### `POST /reception/guests`

**Auth/permission:** JWT; `guests:write`. **Body:** required `name` (2-255), Indian `phone`; optional `email`, `idProofType` (max 50), `idProofNumber` (max 100), `address`, `city`, `state`, `gender` (`MALE|FEMALE|OTHER`), `dateOfBirth`, emergency contact fields, `notes`. **Success 201:** `{ "success": true, "data": { "id": "12", "name": "Guest", "profile": { "idProofType": "AADHAAR" } } }`. **Errors:** 400, 401, 403, 409 `GUEST_EXISTS`. `idProofPhoto` is not implemented.

### `GET /reception/guests`

**Auth/permission:** JWT; `guests:read`. **Query:** optional `search` (name/email/phone). **Success 200:** `{ "success": true, "data": [<Guest>] }`. **Errors:** 401, 403.

### `GET /reception/properties/:propertyId/availability`

**Auth/permission:** JWT; `reception:operate`. **Path:** numeric property ID. **Query:** required ordered `checkIn`, `checkOut` dates. **Success 200:** `{ "success": true, "data": [{ "id": "18", "roomNumber": "101", "beds": [{ "id": "32", "isAvailable": true }] }] }`. **Errors:** 400, 401, 403, 404.

### `POST /reception/bookings`

**Auth/permission:** JWT; `reception:operate`. **Body:** required numeric `guestId`, `propertyId`, `roomId`, `bedId`, `checkIn`, `checkOut`; optional source `WALK_IN|PHONE|WEB` (default `WALK_IN`). **Success 201:** `{ "success": true, "data": <Booking> }`. Price is calculated and the booking is confirmed atomically. **Errors:** 400, 401, 403, 404, 409 bed conflict.

### `PATCH /reception/bookings/:bookingCode/check-in` and `/check-out`

**Auth/permission:** JWT; `reception:operate`. **Path:** booking code. **Request:** no body. **Success 200:** `{ "success": true, "data": <Booking> }`. Check-in requires `CONFIRMED` and occupies the bed; check-out requires `CHECKED_IN`, completes the booking, and frees it. **Errors:** 401, 403, 404, 409 invalid transition/bed unavailable.

## Finance

### `POST /finance/payments`

**Auth/permission:** JWT; `finance:collect`. **Body:** required numeric `bookingId`, positive `amount` <= 10,000,000, `method` (`CASH|UPI|CARD|BANK_TRANSFER|ONLINE`); optional `transactionRef` (max 255), `notes` (max 2000). **Success 201:** `{ "success": true, "data": { "id": "1", "paymentCode": "PAY-...", "amount": "1200.00", "status": "COMPLETED" } }`. An invoice is created and booking payment state recalculated. **Errors:** 400, 401, 403, 404, 409 excess/invalid payment state.

### `GET /finance/payments` and `GET /finance/invoices/:invoiceNumber`

**Auth/permission:** JWT; `finance:read`. **Payments query:** optional numeric `bookingId`; response 200 `{ "success": true, "data": [<Payment>] }`. **Invoice path:** `invoiceNumber`; response 200 contains `id`, booking/payment IDs, invoice number, amounts, status, and issue time. **Errors:** 400 invalid ID, 401, 403, 404 invoice.

### `POST /finance/refunds` and `PATCH /finance/refunds/:refundId/decision`

**Auth:** JWT. Create requires `finance:collect`; decision requires `finance:refund:approve`. **Create body:** numeric `paymentId`, positive `amount`, `reason` 5-2000 chars. **Decision path/body:** numeric `refundId`, `{ "action": "APPROVE|REJECT" }`. **Success:** create 201 with pending refund; decision 200 with updated refund. **Errors:** 400, 401, 403, 404 payment/refund, 409 state or eligible amount conflict.

## Users and inventory

### `GET|POST /roost/users`, `PATCH /roost/users/:userId`

**Auth/role:** JWT; `PLATFORM_ADMIN` (legacy `ADMIN` is accepted). The endpoint is not tenant-admin or manager accessible. `GET` accepts optional `role` (`OWNER|PLATFORM_ADMIN|MANAGER|RECEPTIONIST|STAFF`) and `tenantId` filters; without a filter it returns all non-guest management accounts. `POST` body is `{ "name", "email", "phone?", "password", "role", "tenantId?" }`; password is 12-128 characters. Use `role: "MANAGER"` or `"RECEPTIONIST"` to create the requested operations accounts. All non-platform roles require `tenantId`; a `PLATFORM_ADMIN` must not have one. `PATCH` accepts any subset of `name`, `email`, `phone` (`null` clears it), `role`, `status`, `tenantId`. It prevents self-deactivation and self-role changes. **Success:** GET/PATCH 200; POST 201. User data never includes `password_hash`. **Errors:** 400 `VALIDATION_ERROR|INVALID_ID|TENANT_REQUIRED`, 401, 403 `FORBIDDEN`, 404 `NOT_FOUND`, 409 `EMAIL_EXISTS|INVALID_OPERATION`.

### `POST /roost/users/:userId/reset-password`, `PATCH /roost/users/:userId/activate`, `PATCH /roost/users/:userId/deactivate`

**Auth/role:** JWT; `PLATFORM_ADMIN` or legacy `ADMIN`. The password-reset body is `{ "temporaryPassword": "at-least-12-characters" }`; it replaces the hash but never returns the supplied password, a password hash, or a reset token. Activate/deactivate have no body and set `ACTIVE`/`INACTIVE`. The self-deactivation restriction applies. **Success 200:** reset returns `{ "success": true, "data": { "id": "12", "passwordReset": true } }`; status routes return the user object. **Errors:** 400, 401, 403, 404, 409 `INVALID_OPERATION`.

### Legacy `POST /management/users`, `GET /management/users`, `PATCH /management/users/:userId/status`

**Auth:** JWT. Create/status use `users:manage`; list uses `users:read`. These routes stay tenant-scoped for compatibility. Owners can create `MANAGER`, `RECEPTIONIST`, and `STAFF`; managers can only create or manage `RECEPTIONIST` and `STAFF`, so they cannot promote peers. **Create body:** required `name`, `email`, `password` (12-128), role; optional Indian `phone`. **List query:** optional `role`. **Status path/body:** numeric `userId`, `{ "status": "ACTIVE|INACTIVE|SUSPENDED" }`; caller cannot deactivate self. **Success:** create 201, list/status 200. **Errors:** 400, 401, 403, 404, 409.

### `POST /management/inventory/items` and `GET /management/inventory/items`

**Auth:** JWT. Create uses `inventory:manage`, list `inventory:read`. **Create body:** `propertyId`, `name` 2-255, `category` (`RECURRING|NON_RECURRING`) required; optional `unit` (default `PIECE`), `openingStock`, `minStockLevel`, `costPerUnit` (all non-negative). **List query:** optional `propertyId`. **Success:** create 201 and list 200 return items with stock and `lowStock`. **Errors:** 400, 401, 403, 404 property, 409 duplicate item.

### `POST /management/inventory/items/:itemId/check` and `GET /management/inventory/items/:itemId/history`

**Auth:** JWT. Check uses `inventory:manage`, history `inventory:read`. **Path:** numeric item ID. **Check body:** `type` (`IN|OUT|ADJUSTMENT`), non-zero numeric `quantity`, optional notes max 2000. `OUT` cannot reduce stock below zero. **Success:** check 200 returns item; history 200 returns transactions. **Errors:** 400, 401, 403, 404, 409 `INSUFFICIENT_STOCK`.

## Feedback and complaints

### `POST /experience/feedback` and `GET /experience/feedback/analysis`

**Auth:** JWT. Create needs `experience:write`, analysis `experience:read`. **Create body:** required integer `overallRating` 1-5; optional numeric `bookingId`, `guestId`, optional 1-5 component ratings and comment max 2000. Guest callers use their JWT ID and can only refer to their booking. **Success:** create 201 feedback, analysis 200 `{ "total": 5, "averages": { "overall": 4.5 }, "distribution": [{ "rating": 5, "count": 3 }] }`. **Errors:** 400, 401, 403, 404 booking.

### `POST /experience/complaints`, `GET /experience/complaints`, `PATCH /experience/complaints/:complaintId`

**Auth:** JWT. Create `experience:write`, list `experience:read`, update `experience:manage`. **Create body:** category (`CLEANLINESS|NOISE|MAINTENANCE|SERVICE|FOOD|SAFETY|OTHER`), subject 3-255, description 5-5000 required; optional booking/guest IDs and priority (`LOW|MEDIUM|HIGH|URGENT`, default `MEDIUM`). **List query:** optional status. **Update path/body:** numeric complaint ID; required status (`OPEN|IN_PROGRESS|RESOLVED|CLOSED`), optional `assignedTo`, `resolution` max 5000. **Success:** create 201, others 200, with complaint data. **Errors:** 400, 401, 403, 404 complaint/assignee/booking.

## Reports

Every endpoint below requires JWT permission `reports:read`, has no body, uses the JWT tenant, and returns `200 { "success": true, "data": ... }`; 401 and 403 apply.

| Endpoint | Query | Response data |
| --- | --- | --- |
| `GET /reports/dashboard` | None | Bed/occupancy totals, booking, revenue, guest, complaint, and low-stock summary. |
| `GET /reports/occupancy` | None | `{ status, count }[]` by bed status. |
| `GET /reports/revenue` | Optional `from`, `to` dates | `{ method, payments, amount }[]`. |
| `GET /reports/guests` | None | Guest booking and active-booking counts. |
| `GET /reports/bookings` | None | `{ status, count, value }[]`. |
| `GET /reports/payments` | None | `{ status, count, amount }[]`. |
| `GET /reports/inventory` | None | Items and low-stock flags. |
| `GET /reports/staff-performance` | None | Audit-log counts by user/action. |
| `GET /reports/complaints` | None | Counts by status/priority. |
| `GET /reports/feedback` | None | Feedback totals and averages. |
| `GET /reports/bi/weekly` | None | Seven-day booking/revenue/feedback summary. |
| `GET /reports/bi/monthly` | None | 30-day booking/revenue/feedback summary. |

## System administration

### `GET /system/access-control`

**Auth:** any JWT. **Request:** no parameters/body. **Success 200:** `{ "success": true, "data": { "roles": ["GUEST", "OWNER"], "permissions": { "OWNER": ["..."] } } }`. **Errors:** 401.

### `GET|PUT /system/settings`

**Auth:** JWT; GET `settings:read`, PUT `settings:write`. **GET:** no parameters; response 200 groups effective tenant/global settings by category. **PUT body:** `{ "settings": [{ "key": "check_in_time", "value": "14:00", "category": "GENERAL" }] }`; array min 1, every non-empty `key`, string-or-null `value`, optional category. **PUT success 200:** `{ "success": true, "data": { "updatedCount": 1 } }`. **Errors:** 400, 401, 403.

### `GET|PUT /system/camera`

**Auth:** JWT; GET `settings:read`, PUT `settings:write`. **GET success 200:** `{ "success": true, "data": { "enabled": true, "streamUrl": "https://camera.example/stream", "recordingEnabled": false } }`. **PUT body:** required boolean `enabled`; optional URL `streamUrl`, boolean `recordingEnabled`. **PUT success 200:** `{ "success": true, "data": { "success": true } }`. **Errors:** 400, 401, 403.

### `GET /system/backup` and `POST /system/restore`

**Auth:** JWT; backup `settings:read`, restore `settings:write`. **Backup success 200:** `{ "success": true, "data": { "backupEnabled": false, "backupFrequency": null, "lastBackupAt": null } }`. **Restore request:** no body; it audits a manual restore initiation rather than accepting/uploading a backup. **Restore success 200:** `{ "success": true, "data": { "success": true, "message": "Restore initiated (manual process required)" } }`. **Errors:** 401, 403.

### `GET /system/audit-logs`

**Auth/permission:** JWT; `audit:read`. **Query:** optional numeric `userId`, `entityType`, `action`, `from`, `to`, `page` (default 1), `limit` (1-200, default 50). **Success 200:** `{ "success": true, "data": { "data": [{ "id": "1", "action": "PAYMENT_COLLECTED", "entityType": "PAYMENT", "user": { "id": "5", "name": "Manager" } }], "pagination": { "page": 1, "limit": 50, "total": 1, "pages": 1 } } }`. **Errors:** 400, 401, 403.

## ROOST camera management

These are the required frontend-compatible camera APIs. They are separate from the legacy `/system/camera` configuration endpoints and manage individual camera records.

### `GET /roost/cameras`

**Auth/roles:** JWT; `PLATFORM_ADMIN` or legacy `ADMIN`. **Headers:** `Authorization: Bearer <JWT>`. **Query:** optional `status`: `ONLINE`, `OFFLINE`, or `MAINTENANCE`. **Success 200:** `{ "success": true, "data": [{ "id": "1", "name": "Main Entrance", "location": "Front Gate", "status": "ONLINE", "streamUrl": "https://camera.example/stream", "createdAt": "2026-08-31T00:00:00.000Z", "lastUpdated": "2026-08-31T00:00:00.000Z" }] }`. **Errors:** 401 invalid/missing JWT; 403 incorrect role.

### `POST /roost/cameras`

**Auth/roles:** JWT; `PLATFORM_ADMIN` or legacy `ADMIN`. **Headers:** bearer token and `Content-Type: application/json`. **Body:** required `name` (trimmed string, 2-255), `location` (trimmed string, 2-255); optional `status` (`ONLINE|OFFLINE|MAINTENANCE`, defaults `ONLINE`) and `streamUrl` (valid URL, max 2048). **Example request:** `{ "name": "Main Entrance", "location": "Front Gate", "status": "ONLINE", "streamUrl": "https://camera.example/stream" }`. **Success 201:** `{ "success": true, "data": { "id": "1", "name": "Main Entrance", "location": "Front Gate", "status": "ONLINE", "streamUrl": "https://camera.example/stream" } }`. **Errors:** 400 validation; 401; 403; 409 duplicate name.

### `PATCH /roost/cameras/:cameraId`

**Auth/roles:** JWT; `PLATFORM_ADMIN` or legacy `ADMIN`. **Path:** required positive integer `cameraId`. **Body:** at least one optional field from create; `streamUrl` may be `null` to clear it. **Example request:** `{ "status": "MAINTENANCE" }`. **Success 200:** `{ "success": true, "data": { "id": "1", "status": "MAINTENANCE", "lastUpdated": "2026-08-31T00:00:00.000Z" } }`. **Errors:** 400 validation/invalid ID; 401; 403; 404 camera; 409 duplicate name.

### `DELETE /roost/cameras/:cameraId`

**Auth/roles:** JWT; `PLATFORM_ADMIN` or legacy `ADMIN`. **Path:** required positive integer `cameraId`. **Request:** no body. **Success 200:** `{ "success": true, "data": { "id": "1", "deleted": true } }`. **Errors:** 400 invalid ID; 401; 403; 404 camera.

## Scope and security notes

- Booking statuses are uppercase: `PENDING`, `CONFIRMED`, `REJECTED`, `CANCELLED`, `CHECKED_IN`, `COMPLETED`; payment status is separate.
- Important operational changes create audit records.
- Guest ID-proof metadata is stored, but ID-proof photo upload/storage is not implemented.
- The endpoint index above is the source of truth for registered public APIs.
    