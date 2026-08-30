# ROOST API Reference

This is the complete reference for every route currently registered by the backend.

**Base URL:** `http://localhost:5000/api/v1`
                http://13.51.13.251:5000/api/v1




## Conventions

- Send JSON bodies with `Content-Type: application/json`.
- Protected endpoints require `Authorization: Bearer <JWT>`.
- IDs accept numeric strings or numbers. Returned BigInt IDs are strings.
- New operational modules obtain `tenantId` from the JWT. Some legacy property, room, bed, and booking APIs still require a `tenantId`, as noted.
- Successful responses use `{"success": true, "data": ...}`. Some also return `message`, `items`, or pagination values.

### Errors

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": [{ "field": "email", "message": "Invalid email" }]
}
```

Common codes: `UNAUTHORIZED` (401), `TOKEN_INVALID` (401), `ACCOUNT_INACTIVE` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `DUPLICATE_ENTRY` (409), and `VALIDATION_ERROR` (400).

## Health

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/health` | Public | Returns server health status and a timestamp. |

## Authentication

| Method | Endpoint | Access | Body |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | `name`, `email`, `password`; optional `phone`, `tenantId`. |
| POST | `/auth/login` | Public | `email`, `password`. |
| GET | `/auth/me` | Signed-in user | None. |
| POST | `/auth/change-password` | Signed-in user | `oldPassword`, `newPassword` (minimum 6 characters). |
| POST | `/auth/admin/register` | Public | `name`, `email`, `password`; optional `phone`. Creates `PLATFORM_ADMIN`. |
| POST | `/auth/admin/login` | Public | `email`, `password`. |

When supplied, `phone` must be a valid 10-digit Indian mobile number. Login responses return the JWT in `data`.

```json
{
  "name": "Prakash Patil",
  "email": "prakash@example.com",
  "phone": "9876543210",
  "password": "secure-password"
}
```

## Public properties and bookings

| Method | Endpoint | Description | Request |
| --- | --- | --- | --- |
| GET | `/properties` | Search published properties. | Optional query: `city`, `state`, `search`, `page`, `limit`. |
| GET | `/properties/:slug` | Fetch a property by slug. | — |
| GET | `/properties/:slug/availability` | Get available rooms/beds and pricing. | Required query: `checkIn`, `checkOut` (`YYYY-MM-DD`). |
| POST | `/bookings` | Create a pending booking. | Booking body below. |
| GET | `/bookings/:code` | Fetch a booking by booking code. | — |
| PATCH | `/bookings/:code/cancel` | Cancel a booking. | Optional `{ "reason": "Plans changed" }`. |

### Booking body

```json
{
  "tenantId": "1",
  "guestId": "12",
  "propertyId": "4",
  "roomId": "18",
  "bedId": "32",
  "checkIn": "2026-09-01",
  "checkOut": "2026-09-10",
  "guestName": "Prakash Patil",
  "guestPhone": "9876543210",
  "guestEmail": "prakash@example.com",
  "source": "WEB"
}
```

All fields except `guestEmail` are required. `source` is `WEB`, `WALK_IN`, or `PHONE` and defaults to `WEB`.

## Property, room, and bed management

All endpoints below require an `OWNER` or `STAFF` JWT unless specified. `PLATFORM_ADMIN` can also create properties and update property status.

| Method | Endpoint | Access | Request |
| --- | --- | --- | --- |
| GET | `/properties/mine` | OWNER, STAFF | Lists properties for the JWT tenant. |
| POST | `/properties` | OWNER, STAFF, PLATFORM_ADMIN | Property body below; tenant comes from JWT. |
| PATCH | `/properties/:propertyId` | OWNER, STAFF | Any editable property field; tenant comes from JWT. |
| PATCH | `/properties/:propertyId/status` | OWNER, STAFF, PLATFORM_ADMIN | `{ "status": "DRAFT\|PUBLISHED\|UNPUBLISHED\|ARCHIVED" }`. |
| DELETE | `/properties/:propertyId` | OWNER, STAFF | Deletes property in JWT tenant. |
| GET | `/properties/:propertyId/rooms` | OWNER, STAFF | Required query: `tenantId`. |
| POST | `/properties/:propertyId/rooms` | OWNER, STAFF | Room body below. |
| PATCH | `/rooms/:roomId` | OWNER, STAFF | Room update body below. |
| GET | `/rooms/:roomId/beds` | OWNER, STAFF | Required query: `tenantId` (body `tenantId` also works). |
| POST | `/rooms/:roomId/beds` | OWNER, STAFF | Bed body below. |
| PATCH | `/beds/:bedId` | OWNER, STAFF | Bed update body below. |

### Property body

```json
{
  "name": "Roost Indiranagar",
  "slug": "roost-indiranagar",
  "description": "Comfortable co-living stay",
  "address": "100 Feet Road",
  "city": "Bengaluru",
  "state": "Karnataka",
  "postalCode": "560038",
  "latitude": 12.9784,
  "longitude": 77.6408
}
```

Create requires `name` and a lowercase dashed `slug`; all fields are optional on update. Validation permits legacy `tenantId`, but the controller uses the JWT tenant.

### Room body

```json
{
  "tenantId": "1",
  "roomNumber": "101",
  "floor": 1,
  "genderPolicy": "MIXED",
  "hasAc": true,
  "hasAttachedBathroom": true,
  "basePrice": 500
}
```

Create requires `tenantId`, `roomNumber`, and positive `basePrice`. Defaults: `genderPolicy: MIXED`, `hasAc: false`, `hasAttachedBathroom: false`. Updates take the same optional fields plus `status`: `ACTIVE`, `INACTIVE`, or `MAINTENANCE`; `tenantId` is required.

### Bed body

```json
{
  "tenantId": "1",
  "bedCode": "101-LOWER",
  "position": "LOWER",
  "priceOverride": 600
}
```

Create requires `tenantId` and `bedCode`. `position` is `UPPER`, `LOWER`, or `SINGLE`. Updates also allow `status`: `AVAILABLE`, `BOOKED`, `BLOCKED`, or `MAINTENANCE`; `priceOverride` can be `null` to clear it.

## Owner booking workflow and analytics

| Method | Endpoint | Access | Request |
| --- | --- | --- | --- |
| GET | `/bookings` | OWNER, STAFF, PLATFORM_ADMIN | Lists tenant bookings; optional query: `tenantId`, `propertyId`, `status`, `page`, `limit`. |
| GET | `/bookings/owner` | OWNER, STAFF, PLATFORM_ADMIN | Alias of the owner booking list. |
| PATCH | `/bookings/:code/confirm` | OWNER, STAFF | Confirms a booking. JWT tenant is used; `tenantId` body fallback is accepted. |
| PATCH | `/bookings/:code/approve` | OWNER, STAFF | Alias of `/confirm`. |
| PATCH | `/bookings/:code/reject` | OWNER, STAFF | `{ "reason": "At least 5 characters" }`. |
| GET | `/analytics/owner-summary` | OWNER, STAFF | Returns the current tenant's summary. |

## Reception

Every reception endpoint requires a JWT and the stated permission. The tenant is taken from the JWT.

| Method | Endpoint | Permission | Request |
| --- | --- | --- | --- |
| POST | `/reception/guests` | `guests:write` | Guest body below. |
| GET | `/reception/guests` | `guests:read` | Optional query: `search`. |
| GET | `/reception/properties/:propertyId/availability` | `reception:operate` | Required query: `checkIn`, `checkOut` (`YYYY-MM-DD`). |
| POST | `/reception/bookings` | `reception:operate` | Reception booking body below. |
| PATCH | `/reception/bookings/:bookingCode/check-in` | `reception:operate` | No body. |
| PATCH | `/reception/bookings/:bookingCode/check-out` | `reception:operate` | No body. |

Guest registration requires `name` and `phone`. Optional fields: `email`, `idProofType`, `idProofNumber`, `address`, `city`, `state`, `gender` (`MALE`, `FEMALE`, `OTHER`), `dateOfBirth`, `emergencyContactName`, `emergencyContactPhone`, and `notes`.

```json
{
  "guestId": "12",
  "propertyId": "4",
  "roomId": "18",
  "bedId": "32",
  "checkIn": "2026-09-01",
  "checkOut": "2026-09-10",
  "source": "WALK_IN"
}
```

All reception booking fields are required except `source`, which defaults to `WALK_IN` and may be `WALK_IN`, `PHONE`, or `WEB`.

## Finance

Every finance route requires a JWT and uses its tenant.

| Method | Endpoint | Permission | Request |
| --- | --- | --- | --- |
| POST | `/finance/payments` | `finance:collect` | Payment body below. |
| GET | `/finance/payments` | `finance:read` | Optional query: `bookingId`. |
| GET | `/finance/invoices/:invoiceNumber` | `finance:read` | — |
| POST | `/finance/refunds` | `finance:collect` | `{ "paymentId": "1", "amount": 250, "reason": "Reason (5–2000 characters)" }`. |
| PATCH | `/finance/refunds/:refundId/decision` | `finance:refund:approve` | `{ "action": "APPROVE" }` or `{ "action": "REJECT" }`. |

```json
{
  "bookingId": "10",
  "amount": 1200,
  "method": "UPI",
  "transactionRef": "upi-reference",
  "notes": "Advance payment"
}
```

`bookingId`, positive `amount`, and `method` are required. Method: `CASH`, `UPI`, `CARD`, `BANK_TRANSFER`, or `ONLINE`; the remaining fields are optional.

## Management and inventory

| Method | Endpoint | Permission | Request |
| --- | --- | --- | --- |
| POST | `/management/users` | `users:manage` | `name`, `email`, `password`, `role`; optional `phone`. Role: `MANAGER`, `RECEPTIONIST`, or `STAFF`. Password: 8–128 chars. |
| GET | `/management/users` | `users:read` | Optional query: `role`. |
| PATCH | `/management/users/:userId/status` | `users:manage` | `{ "status": "ACTIVE\|INACTIVE\|SUSPENDED" }`. |
| POST | `/management/inventory/items` | `inventory:manage` | Inventory item body below. |
| GET | `/management/inventory/items` | `inventory:read` | Optional query: `propertyId`. |
| POST | `/management/inventory/items/:itemId/check` | `inventory:manage` | Stock-adjustment body below. |
| GET | `/management/inventory/items/:itemId/history` | `inventory:read` | — |

```json
{
  "propertyId": "4",
  "name": "Bath towel",
  "category": "RECURRING",
  "unit": "PIECE",
  "openingStock": 20,
  "minStockLevel": 5,
  "costPerUnit": 160
}
```

Inventory creation requires `propertyId`, `name`, and `category` (`RECURRING` or `NON_RECURRING`). `unit` defaults to `PIECE`; stock and cost cannot be negative.

```json
{
  "type": "OUT",
  "quantity": 2,
  "notes": "Issued to room 101"
}
```

Stock adjustment type is `IN`, `OUT`, or `ADJUSTMENT`; quantity cannot be zero.

## Guest experience

| Method | Endpoint | Permission | Request |
| --- | --- | --- | --- |
| POST | `/experience/feedback` | `experience:write` | Feedback body below. |
| GET | `/experience/feedback/analysis` | `experience:read` | — |
| POST | `/experience/complaints` | `experience:write` | Complaint body below. |
| GET | `/experience/complaints` | `experience:read` | Optional query: `status`. |
| PATCH | `/experience/complaints/:complaintId` | `experience:manage` | Complaint update body below. |

```json
{
  "bookingId": "10",
  "guestId": "12",
  "overallRating": 5,
  "cleanlinessRating": 5,
  "serviceRating": 4,
  "valueRating": 4,
  "comment": "Comfortable stay"
}
```

`overallRating` is required; all ratings are integers from 1 to 5. The other feedback fields are optional.

```json
{
  "bookingId": "10",
  "guestId": "12",
  "category": "MAINTENANCE",
  "subject": "AC not cooling",
  "description": "The AC has not cooled since this morning.",
  "priority": "HIGH"
}
```

Complaint category: `CLEANLINESS`, `NOISE`, `MAINTENANCE`, `SERVICE`, `FOOD`, `SAFETY`, or `OTHER`. Priority defaults to `MEDIUM` and may be `LOW`, `MEDIUM`, `HIGH`, or `URGENT`.

```json
{
  "status": "IN_PROGRESS",
  "assignedTo": "5",
  "resolution": "Technician assigned"
}
```

Complaint status: `OPEN`, `IN_PROGRESS`, `RESOLVED`, or `CLOSED`; `assignedTo` and `resolution` are optional.

## Reports

Every report endpoint requires `reports:read`.

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/reports/dashboard` | Dashboard summary. |
| GET | `/reports/occupancy` | Occupancy report. |
| GET | `/reports/revenue` | Revenue by payment method. Optional query: `from`, `to`. |
| GET | `/reports/guests` | Guest report. |
| GET | `/reports/bookings` | Booking report. |
| GET | `/reports/payments` | Payment report. |
| GET | `/reports/inventory` | Inventory report. |
| GET | `/reports/staff-performance` | Staff-performance report. |
| GET | `/reports/complaints` | Complaint report. |
| GET | `/reports/feedback` | Feedback report. |
| GET | `/reports/bi/weekly` | Business-intelligence summary for the last 7 days. |
| GET | `/reports/bi/monthly` | Business-intelligence summary for the last 30 days. |

## System administration

All system routes require a JWT. `/system/access-control` has no additional permission requirement.

| Method | Endpoint | Permission | Request |
| --- | --- | --- | --- |
| GET | `/system/access-control` | Signed-in user | Returns access-control information for the current role. |
| GET | `/system/settings` | `settings:read` | Optional query: `category`. |
| PUT | `/system/settings` | `settings:write` | Setting body below. |
| GET | `/system/camera` | `settings:read` | Camera configuration. |
| PUT | `/system/camera` | `settings:write` | Setting body below. |
| GET | `/system/backup` | `settings:read` | Export tenant backup. |
| POST | `/system/restore` | `settings:write` | `{ "settings": [<setting>, ...] }`, with 1–200 settings. |
| GET | `/system/audit-logs` | `audit:read` | Optional query: `limit`. |

```json
{
  "settingKey": "check_in_time",
  "settingValue": "14:00",
  "category": "GENERAL",
  "description": "Standard guest check-in time"
}
```

`settingKey` is required. `settingValue` can be a string or `null`; `category` defaults to `GENERAL`; `description` is optional.

## Permission matrix

| Role | Permissions |
| --- | --- |
| `PLATFORM_ADMIN` | All permissions. |
| `OWNER`, `MANAGER` | Guests, reception, finance (including refunds), users, inventory, experience read/manage, reports, settings, and audit logs. |
| `RECEPTIONIST`, `STAFF` | Guests, reception, finance read/collect, and experience write. |
| `GUEST` | Experience write. |

Property, room, bed, booking, and analytics routes also enforce the roles listed in their endpoint tables.
