# ROOST API Documentation

**Base URL:** `http://localhost:5000/api/v1`

**Authentication:** 
Most endpoints require a JWT token in the header:
`Authorization: Bearer <your_jwt_token>`

---

## 1. GUEST APIs (Public & Authenticated Guests)
*Guests can search for properties, check availability, create bookings, and cancel their own bookings.*

### 1.1 Search Properties
* `GET /properties`
* **Query Params:** `city`, `state`, `search`

### 1.2 View Property Availability
* `GET /properties/:slug/availability?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD`
* **Response:** Returns rooms, beds, and calculated pricing for the stay.

### 1.3 Create Booking
* `POST /bookings`
* **Request Body:**
```json
{
  "tenantId": "1",
  "guestId": "1",
  "propertyId": "1",
  "roomId": "1",
  "bedId": "1",
  "checkIn": "2026-09-01",
  "checkOut": "2026-09-10",
  "guestName": "Prakash Patil",
  "guestPhone": "9876543210",
  "source": "WEB"
}
```

### 1.4 Cancel Booking
* `PATCH /bookings/:code/cancel`
* **Request Body:**
```json
{
  "reason": "Plans changed"
}
```

---

## 2. OWNER & STAFF APIs
*Requires `OWNER` or `STAFF` role token. Used for managing properties, inventory, and approving bookings.*

### 2.1 Create Property
* `POST /properties`
* **Request Body:**
```json
{
  "tenantId": "1",
  "name": "Roost Indiranagar",
  "slug": "roost-indiranagar",
  "city": "Bengaluru",
  "address": "100 Feet Road"
}
```

### 2.2 Create Room
* `POST /properties/:propertyId/rooms`
* **Request Body:**
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

### 2.3 Create Bed
* `POST /rooms/:roomId/beds`
* **Request Body:**
```json
{
  "tenantId": "1",
  "bedCode": "101-LOWER",
  "position": "LOWER",
  "priceOverride": 600
}
```

### 2.4 List Bookings
* `GET /bookings?tenantId=1`
* **Query Params:** `tenantId`, `propertyId`, `status`

### 2.5 Confirm Booking
* `PATCH /bookings/:code/confirm`
* **Request Body:**
```json
{
  "tenantId": "1"
}
```

### 2.6 Reject Booking
* `PATCH /bookings/:code/reject`
* **Request Body:**
```json
{
  "tenantId": "1",
  "reason": "Hostel is fully booked"
}
```

---

## 3. PLATFORM ADMIN APIs (Superuser)
*Requires `PLATFORM_ADMIN` token.*

### 3.1 Publish Property (Go Live)
* `PATCH /properties/:propertyId/status`
* **Request Body:**
```json
{
  "tenantId": "1",
  "status": "PUBLISHED"
}
```

---

## 4. AUTHENTICATION APIs
*Used by all roles to gain access.*

### 4.1 Register User
* `POST /auth/register`
* **Request Body:**
```json
{
  "name": "Prakash Patil",
  "email": "prakash@example.com",
  "phone": "9876543210",
  "password": "mySecurePassword123",
  "role": "GUEST" 
}
```
*(Note: `role` can be `GUEST`, `OWNER`, `STAFF`)*

### 4.2 Login
* `POST /auth/login`
* **Request Body:**
```json
{
  "email": "prakash@example.com",
  "password": "mySecurePassword123"
}
```
* **Response:** Returns the JWT token to use in the `Authorization` header.
