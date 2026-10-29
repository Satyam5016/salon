# Bliss Beauty Salon

Production-style full-stack MERN foundation for a salon website, booking, queue, and admin platform.

## Stack

- Frontend: React, Vite, Tailwind CSS, React Router, Axios, Lucide React, Socket.IO Client, Zustand
- Backend: Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, Socket.IO

## Project Structure

```text
bliss-beauty-salon/
├── client/
└── server/
```

## Getting Started

Install dependencies for each app:

```bash
cd client
npm install

cd ../server
npm install
```

Create environment files from the examples:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Run the backend:

```bash
cd server
npm run dev
```

Seed MongoDB:

```bash
cd server
npm run seed
```

Default seeded admin:

```text
Email: admin@blissbeautysalon.com
Password: Admin@12345
```

Run the frontend:

```bash
cd client
npm run dev
```

## Health Check

```http
GET /api/health
```

Response:

```json
{
  "success": true,
  "message": "Bliss Beauty Salon API is running"
}
```

## Admin Auth

```http
POST /api/admin/auth/login
GET /api/admin/auth/me
POST /api/admin/auth/logout
```

Admin sessions use a JWT stored in an HTTP-only cookie. The frontend stores only the sanitized admin profile for UI state.

## Services

```http
GET    /api/services
GET    /api/services/:id
GET    /api/admin/services
POST   /api/admin/services
PUT    /api/admin/services/:id
DELETE /api/admin/services/:id
PATCH  /api/admin/services/:id/status
```

Admin service routes require an authenticated admin session.

## Staff

```http
GET    /api/staff
GET    /api/admin/staff
POST   /api/admin/staff
PUT    /api/admin/staff/:id
DELETE /api/admin/staff/:id
PATCH  /api/admin/staff/:id/status
```

Admin staff routes require an authenticated admin session.

## Booking Availability

```http
GET /api/booking/availability?serviceId=:serviceId&staffId=any&date=YYYY-MM-DD
```

The availability endpoint prevents past-date booking, filters by eligible staff, respects salon/staff hours, and excludes conflicting active appointments.

## Appointments

```http
POST /api/appointments
POST /api/appointments/track
```

Creates a customer appointment after validating service, optional staff, phone, date, slot availability, and staff eligibility. New bookings start with `status = booked` and a reference like `BLISS-2026-A83K9`.

Tracking requires booking reference and phone number, and returns only customer-safe appointment, queue, and timing information.

## Walk-ins

```http
POST /api/admin/walk-ins
```

Creates an authenticated admin walk-in appointment with `source = walk-in`, `status = arrived`, `arrivalTime = now`, and the next shared queue position.

## Live Queue

```http
GET /api/admin/queue/live
GET /api/appointments/:id/queue-status
```

Queue calculation is centralized in `queueService` and considers online bookings, walk-ins, arrival status, booking times, service duration, assigned/preferred stylists, in-service appointments, late customers, skipped customers, and completed/cancelled/no-show exclusions.

## Check-In

```http
PATCH /api/admin/appointments/:id/check-in
POST  /api/appointments/self-check-in
```

Admin check-in marks an appointment as `arrived` immediately. Customer self check-in requires booking reference and phone number, and is limited by `selfCheckInWindowMinutes` in salon settings.

## Start Service

```http
PATCH /api/admin/appointments/:id/start
```

Starts service for an arrived or waiting customer, assigns the selected or next eligible available stylist, prevents stylist double-booking, sets `status = in_service`, records `serviceStartTime`, and returns the recalculated queue status.

## Complete Service

```http
PATCH /api/admin/appointments/:id/complete
```

Completes an in-service appointment, records `serviceEndTime`, frees the stylist for the next eligible customer, recalculates the shared live queue, updates notification status for the next customer, and emits Socket.IO `queue:updated`, `appointment:updated`, and `notification` events.

## Late, Skip, And No-Show

```http
PATCH /api/admin/appointments/:id/late
PATCH /api/admin/appointments/:id/skip
PATCH /api/admin/appointments/:id/no-show
```

Late and no-show actions respect `gracePeriodMinutes` from salon settings. Skipped customers remain in the shared queue behind physically arrived customers, while no-shows are removed from the active queue. A skipped customer can still check in later and is inserted into the next fair physical queue position.

## Notifications

```http
PATCH /api/notifications/:id/browser-sent
```

`notificationService` creates database-backed in-app/browser notification records for booking confirmation, two customers ahead, one customer ahead, turn available, skipped, and no-show events. Browser notifications are emitted over Socket.IO when clients are connected and can be acknowledged when permission is granted. The service is channel-based so email, SMS, and WhatsApp providers can be added later.

## Socket.IO Live Updates

Admin clients join the `admin` room and receive `queue:updated`, `appointment:updated`, `staff:availability`, and admin-safe `notification` events. Customer tracking joins a private `booking:<bookingReference>` room and receives only that booking's `appointment:updated`, `appointment:next`, `appointment:your-turn`, and notification events.

## Admin Live Queue UI

```text
/admin/queue
```

The live queue view separates in-service chairs, waiting-at-salon customers, upcoming online bookings, and late/skipped exceptions. It auto-updates through Socket.IO and shows elapsed timers for in-progress services.

## Smart Waiting Times

Live queue estimates are calculated in the backend from active services, elapsed service time, expected remaining time, chair capacity, active compatible staff, assigned/preferred stylist constraints, and customers ahead. Estimates are recalculated after check-in, start, completion, walk-in creation, skip, late, and no-show actions.

## Salon Settings

```http
GET /api/settings
GET /api/admin/settings
PUT /api/admin/settings
```

Admins can configure salon name, phone, WhatsApp, email, address, opening and closing times, booking interval, grace period, notification threshold, chair count, timezone, maximum advance booking days, and self check-in window from `/admin/settings`. Booking availability and public contact surfaces read these settings from MongoDB.
