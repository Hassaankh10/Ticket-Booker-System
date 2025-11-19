# TicketBooker - Production-Ready Event Management System

A production-ready event management and ticketing system built with **Node.js**, **Express 5**, and **SQLite**. The system follows modern software design principles with a layered architecture, comprehensive security, and scalable database design.

## 🏗️ Architecture Overview

The project follows a **layered architecture** pattern with clear separation of concerns:

```
/src
├── app.js              # Express application setup & middleware
├── server.js           # Server startup, migrations, seeding
├── routes/             # Route definitions (API endpoints)
├── controllers/        # HTTP request handlers
├── services/           # Business logic & database operations
├── middleware/         # Authentication, validation, rate limiting, error handling
├── db/                 # Database connection, migrations, seeds
├── utils/              # Configuration, JWT, logger, helpers
└── validators/         # Joi validation schemas
```

### Architecture Layers

1. **Routes Layer** (`/routes`)
   - Defines API endpoints
   - Applies middleware (auth, validation, rate limiting)
   - Delegates to controllers

2. **Controllers Layer** (`/controllers`)
   - Handles HTTP requests/responses
   - Validates user permissions
   - Delegates business logic to services
   - Error handling with try/catch

3. **Services Layer** (`/services`)
   - Contains all business logic
   - Performs database operations
   - Handles data validation and transformation
   - Implements transaction management

4. **Database Layer** (`/db`)
   - SQLite connection management
   - Migration system
   - Database seeding
   - Query helpers with transaction support

5. **Middleware Layer** (`/middleware`)
   - Authentication (JWT)
   - Authorization (Admin checks)
   - Request validation (Joi)
   - Rate limiting
   - Input sanitization
   - Error handling
   - Request logging

## 🔒 Security Features

### Implemented Security Measures

- **Helmet.js**: Sets secure HTTP headers
- **CORS**: Configurable origin whitelist
- **Rate Limiting**: Prevents abuse (200 requests per 15 minutes by default)
- **JWT Authentication**: Token-based auth with no fallback secrets
- **Input Sanitization**: XSS protection and request sanitization
- **Request Validation**: Joi schemas on all routes
- **SQL Injection Protection**: Parameterized queries via better-sqlite3
- **Password Hashing**: bcryptjs with salt rounds
- **Error Handling**: Centralized error handling without exposing internals

### Security Configuration

```env
JWT_SECRET=your-secure-secret-here  # REQUIRED - no fallback
CORS_ORIGINS=http://localhost:3000,http://localhost:4000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200
```

## 🗄️ Database Design

### SQLite Database Features

- **Foreign Key Constraints**: Enabled with `PRAGMA foreign_keys = ON`
- **Indexes**: Optimized for common queries
  - `idx_users_email`: Fast user lookups
  - `idx_bookings_event`: Event booking queries
  - `idx_bookings_user`: User booking history
  - `idx_bookings_status`: Status filtering
  - `idx_events_status`: Event status filtering
  - `idx_seat_locks_event`: Seat lock queries
  - `idx_seat_locks_expires`: Expired lock cleanup
- **Soft Deletes**: Events use `deleted_at` timestamp
- **Data Integrity**: CHECK constraints on status fields
- **WAL Mode**: Write-Ahead Logging for better concurrency

### Database Schema

**Tables:**
- `roles`: User roles (admin, customer)
- `users`: User accounts with soft delete support
- `events`: Event listings with status management
- `bookings`: Ticket bookings with payment tracking
- `seat_locks`: Temporary seat reservations (5-minute TTL)
- `feedback`: User feedback with status workflow

**Relationships:**
- Users → Roles (many-to-one)
- Users → Bookings (one-to-many)
- Events → Bookings (one-to-many)
- Events → Seat Locks (one-to-many)
- Users → Seat Locks (one-to-many)
- Bookings → Seat Locks (one-to-one)

## 🎫 Seat Locking System

### How It Works

1. **Lock Creation**: When a user selects seats, a lock is created with 5-minute expiration
2. **Automatic Cleanup**: Background worker releases expired locks every 60 seconds
3. **Booking Conversion**: On payment, lock is consumed and converted to confirmed booking
4. **Manual Release**: Users/admins can manually release locks

### Configuration

```env
SEAT_LOCK_TTL_MS=300000        # 5 minutes
SEAT_LOCK_SWEEP_MS=60000       # 1 minute cleanup interval
```

### API Endpoints

- `POST /api/bookings/lock` - Create seat lock
- `DELETE /api/bookings/lock/:lockId` - Release seat lock

## 📊 Admin Panel & Analytics

### Admin API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/overview` | GET | Dashboard statistics |
| `/api/admin/revenue` | GET | Total revenue + per-event breakdown |
| `/api/admin/popular-events` | GET | Top 5 most booked events |
| `/api/admin/user-stats` | GET | User activity statistics |
| `/api/admin/events/status` | GET | Active vs inactive events count |
| `/api/admin/events/:id/status` | PATCH | Update event status |
| `/api/admin/events/:id` | DELETE | Soft delete event |
| `/api/admin/users` | POST | Create admin/user account |

### Analytics Queries

The system uses optimized SQL queries with:
- `SUM()` for revenue calculations
- `COUNT()` for booking statistics
- `GROUP BY` for aggregations
- `JOIN` for relational data
- Efficient indexes for fast queries

## ✅ Validation

All API endpoints use **Joi** validation schemas:

- **Auth**: Register, Login
- **Events**: Create, Update, Status change
- **Bookings**: Create booking, Seat lock
- **Feedback**: Create, Update status
- **Admin**: Create user, Event status

Validation middleware:
- Strips unknown fields
- Converts types automatically
- Returns detailed error messages
- Aborts early on first error

## 📝 Logging

### Logging System

- **Winston**: Structured JSON logging
- **Morgan**: HTTP request logging
- **Custom Logger**: Business logic logging (bookings, admin actions)

### Log Levels

- `error`: Errors and exceptions
- `warn`: Warnings (cancellations, etc.)
- `info`: General information (bookings, server start)
- `debug`: Debug information (development only)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
cd Ticket-Booker-System

# Install dependencies
npm install

# Copy environment file
cp env.sample .env

# Edit .env and set JWT_SECRET (REQUIRED)
# JWT_SECRET=your-super-secure-secret-here

# Start development server
npm run dev

# Or start production server
npm start
```

### Environment Variables

**Required:**
- `JWT_SECRET`: Secret key for JWT tokens (no fallback)

**Optional:**
- `PORT`: Server port (default: 4000)
- `NODE_ENV`: Environment (development/production)
- `DB_PATH`: SQLite database path
- `CORS_ORIGINS`: Comma-separated allowed origins
- `RATE_LIMIT_WINDOW_MS`: Rate limit window (default: 15 minutes)
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window (default: 200)
- `SEAT_LOCK_TTL_MS`: Seat lock expiration (default: 5 minutes)
- `SEAT_LOCK_SWEEP_MS`: Lock cleanup interval (default: 1 minute)

### Sample Credentials

After seeding, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ticketbook.com | Admin@123 |

## 📁 Project Structure

```
Ticket-Booker-System/
├── src/
│   ├── app.js                    # Express app configuration
│   ├── server.js                 # Server startup
│   ├── routes/                   # API route definitions
│   │   ├── index.js
│   │   ├── auth.routes.js
│   │   ├── event.routes.js
│   │   ├── booking.routes.js
│   │   ├── feedback.routes.js
│   │   └── admin.routes.js
│   ├── controllers/              # Request handlers
│   │   ├── auth.controller.js
│   │   ├── event.controller.js
│   │   ├── booking.controller.js
│   │   ├── feedback.controller.js
│   │   └── admin.controller.js
│   ├── services/                 # Business logic
│   │   ├── auth.service.js
│   │   ├── event.service.js
│   │   ├── booking.service.js
│   │   ├── feedback.service.js
│   │   ├── admin.service.js
│   │   ├── seatLock.service.js
│   │   └── user.service.js
│   ├── middleware/               # Express middleware
│   │   ├── auth.middleware.js
│   │   ├── admin.middleware.js
│   │   ├── validation.middleware.js
│   │   ├── rateLimit.middleware.js
│   │   ├── sanitize.middleware.js
│   │   ├── logger.middleware.js
│   │   └── error.middleware.js
│   ├── db/                       # Database layer
│   │   ├── connection.js
│   │   ├── index.js
│   │   ├── migrations/
│   │   │   └── 001_init.js
│   │   └── seed.js
│   ├── utils/                    # Utilities
│   │   ├── config.js
│   │   ├── jwt.js
│   │   ├── logger.js
│   │   ├── errors.js
│   │   ├── response.js
│   │   └── seatUtils.js
│   └── validators/               # Joi schemas
│       ├── auth.validator.js
│       ├── event.validator.js
│       ├── booking.validator.js
│       ├── feedback.validator.js
│       └── admin.validator.js
├── index.html                    # Frontend application
├── app.js                        # Frontend JavaScript
├── style.css                     # Frontend styles
├── server.js                     # Entry point (requires src/server.js)
├── package.json
├── env.sample
└── README.md
```

## 🔄 Database Migrations

Migrations are automatically run on server startup. The system uses a simple migration approach:

1. Check if tables exist
2. Create tables with indexes and constraints
3. Seed initial data (roles, admin user, sample events)

**Migration Features:**
- Foreign key constraints enabled
- Indexes for performance
- Soft delete support
- Data integrity checks

## 🧪 API Documentation

### Authentication

**POST** `/api/auth/register`
- Register new user account
- Body: `{ full_name, email, username, password, phone? }`

**POST** `/api/auth/login`
- Login and receive JWT token
- Body: `{ email, password }`

**GET** `/api/auth/profile`
- Get current user profile
- Requires: Authentication

### Events

**GET** `/api/events`
- List all active events
- Query: `?includeInactive=true&status=active`

**GET** `/api/events/:id`
- Get event details

**POST** `/api/events`
- Create new event (Admin only)
- Requires: Authentication, Admin role

**PUT** `/api/events/:id`
- Update event (Admin only)
- Requires: Authentication, Admin role

**DELETE** `/api/events/:id`
- Soft delete event (Admin only)
- Requires: Authentication, Admin role

### Bookings

**GET** `/api/bookings`
- List user bookings
- Query: `?scope=all` (Admin only)
- Requires: Authentication

**POST** `/api/bookings`
- Create booking
- Body: `{ event_id, num_tickets, lock_id? }`
- Requires: Authentication

**POST** `/api/bookings/lock`
- Create seat lock (5-minute TTL)
- Body: `{ event_id, num_tickets }`
- Requires: Authentication

**DELETE** `/api/bookings/lock/:lockId`
- Release seat lock
- Requires: Authentication

**PATCH** `/api/bookings/:id/cancel`
- Cancel booking
- Requires: Authentication

### Feedback

**POST** `/api/feedback`
- Submit feedback
- Body: `{ event_id?, rating?, category, message }`
- Requires: Authentication

**GET** `/api/feedback`
- List feedback
- Query: `?scope=mine|all`
- Requires: Authentication

**PATCH** `/api/feedback/:id`
- Update feedback status (Admin only)
- Body: `{ status }`
- Requires: Authentication, Admin role

### Admin

**GET** `/api/admin/overview`
- Dashboard overview statistics
- Requires: Authentication, Admin role

**GET** `/api/admin/revenue`
- Revenue report (total + per-event)
- Requires: Authentication, Admin role

**GET** `/api/admin/popular-events`
- Top 5 most booked events
- Requires: Authentication, Admin role

**GET** `/api/admin/user-stats`
- User activity statistics
- Requires: Authentication, Admin role

**GET** `/api/admin/events/status`
- Event status breakdown (active vs inactive)
- Requires: Authentication, Admin role

**PATCH** `/api/admin/events/:id/status`
- Update event status
- Body: `{ status }`
- Requires: Authentication, Admin role

**DELETE** `/api/admin/events/:id`
- Soft delete event
- Requires: Authentication, Admin role

**POST** `/api/admin/users`
- Create user/admin account
- Body: `{ full_name, email, username, password, phone?, role }`
- Requires: Authentication, Admin role

## 🛠️ Development

### Code Quality

- **Error Handling**: All controllers use try/catch with centralized error handler
- **Async/Await**: Consistent async patterns throughout
- **DRY Principle**: Reusable services and utilities
- **Type Safety**: Joi validation provides runtime type checking
- **Logging**: Comprehensive logging for debugging and monitoring

### Best Practices Implemented

1. **Separation of Concerns**: Clear layer boundaries
2. **Single Responsibility**: Each service/controller has one job
3. **Dependency Injection**: Services are imported, not instantiated
4. **Error Handling**: Centralized error handling middleware
5. **Security First**: Multiple security layers
6. **Database Optimization**: Indexes and efficient queries
7. **Transaction Management**: Atomic operations where needed
8. **Logging**: Structured logging for observability

## 📦 Dependencies

### Production

- `express`: Web framework
- `better-sqlite3`: SQLite database driver
- `bcryptjs`: Password hashing
- `jsonwebtoken`: JWT authentication
- `joi`: Request validation
- `helmet`: Security headers
- `cors`: CORS middleware
- `express-rate-limit`: Rate limiting
- `morgan`: HTTP request logging
- `winston`: Application logging
- `xss-clean`: XSS protection
- `hpp`: HTTP parameter pollution protection
- `dotenv`: Environment variable management

### Development

- `nodemon`: Development server with hot reload

## 🚢 Deployment

### Production Checklist

- [ ] Set strong `JWT_SECRET` in environment
- [ ] Configure `CORS_ORIGINS` to production domains
- [ ] Set `NODE_ENV=production`
- [ ] Configure `DB_PATH` to persistent storage
- [ ] Set up log aggregation (Winston outputs JSON)
- [ ] Configure rate limits for production load
- [ ] Set up database backups
- [ ] Enable HTTPS/TLS
- [ ] Configure reverse proxy (nginx/Apache)
- [ ] Set up monitoring and alerts

### Database Backup

SQLite databases can be backed up by copying the `.db` file. For production, consider:
- Scheduled backups
- WAL file management
- Point-in-time recovery

## 📄 License

ISC

## 🙏 Acknowledgments

Built with modern Node.js best practices, following Software Design & Architecture (SDA) principles for maintainability, scalability, and security.

---

**Refactor complete. All improvements implemented using SQLite.**
