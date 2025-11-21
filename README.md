# TicketBooker

A production-ready event ticketing demo that now ships with an Express + SQLite API, database-backed authentication, normalized schema, feedback workflows, and multi-admin support.

## Features

- **Secure auth** – bcrypt hashed passwords, JWT-based sessions, server-side validation.
- **Normalized data model** – separate `roles`, referential integrity, and dedicated `feedback` table.
- **Admin panel** – manage events, bookings, user feedback, and onboard new admin/support accounts.
- **Feedback loop** – customers can submit platform/event feedback, admins can triage and resolve.
- **Deployment friendly** – single Node.js server that serves both API and static UI.

## Getting Started

```bash
cd /Users/muhammadhassaankhan/Downloads/ticket-booking-system.zip
# Optional: cp env.sample .env (if your environment allows .env files)
# Otherwise export vars manually before starting the server
export PORT=4000
export JWT_SECRET='super-secret'
npm install
npm run dev                   # nodemon
# or
npm start                     # production node server
```

Visit `http://localhost:4000`.

### Sample credentials

| Role  | Username / Email        | Password        |
|-------|-------------------------|-----------------|
| Admin | `admin@ticketbook.com`  | `Admin@123`     |
| User  | `john_doe` / email list | `Customer@123`  |

## Database

- SQLite file: `ticket_booking_system.db`
- Key tables: `roles`, `users`, `events`, `bookings`, `feedback`
- Seed data + migrations run automatically via `src/db.js`

## Project Scripts

| Script | Purpose                  |
|--------|--------------------------|
| `npm run dev` | Start server with nodemon |
| `npm start`   | Start server (node)        |

## Feedback & Admin Workflows

- Customers submit feedback from the dashboard (with optional event + rating).
- Admins review all feedback, update statuses, and create additional admin/support accounts directly from the portal.

## Deployment Notes

- Set `NODE_ENV=production` and provide a strong `JWT_SECRET`.
- Behind a reverse proxy, ensure static assets resolve to `/`.
- Backup `ticket_booking_system.db` regularly or point `DB_PATH` env var to managed storage.

