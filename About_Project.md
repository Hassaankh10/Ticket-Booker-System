# About TicketBooker Project

A production-ready event management and ticketing system built with **Next.js**, **React**, and **SQLite**. The system follows modern software design principles with a layered architecture, comprehensive security, and scalable database design.

## ✨ Features

- 🎫 **Event Management**: Create, update, and manage events with full CRUD operations
- 🔐 **Secure Authentication**: JWT-based authentication with role-based access control
- 💺 **Seat Locking System**: Prevents double-booking with 5-minute seat reservations
- 💰 **Automatic Refunds**: Automatic refund processing when events are deleted or inactivated
- 📊 **Admin Analytics**: Comprehensive revenue reports, popular events, and user statistics
- 🛡️ **Security First**: Multiple security layers including rate limiting, input validation, and sanitization
- 📝 **Feedback System**: User feedback collection and management
- 🎨 **Modern UI**: Responsive frontend with image fallbacks and error handling

## 🏗️ Architecture Overview

The project follows a **layered architecture** pattern with clear separation of concerns:

```
/src
├── app.js              # Express application setup & middleware (legacy)
├── server.js           # Server startup, migrations, seeding (legacy)
├── routes/             # Route definitions (API endpoints) - legacy
├── controllers/        # HTTP request handlers - legacy
├── services/           # Business logic & database operations
├── middleware/         # Authentication, validation, rate limiting, error handling
├── db/                 # Database connection, migrations, seeds
├── utils/              # Configuration, JWT, logger, helpers
├── validators/         # Joi validation schemas
└── lib/                # Next.js API helpers

/pages
├── api/                # Next.js API routes
│   ├── auth/           # Authentication endpoints
│   ├── events/         # Event management endpoints
│   ├── bookings/       # Booking endpoints
│   ├── feedback/       # Feedback endpoints
│   └── admin/          # Admin endpoints
├── _app.js             # Next.js App component
├── _document.js        # Next.js Document component
└── index.js            # Main frontend page

/public
├── app.js              # Frontend JavaScript application
├── style.css           # Frontend styles
└── index.html          # Legacy HTML (if exists)
```

### Architecture Layers

1. **API Routes Layer** (`/pages/api`)
   - Next.js API route handlers
   - Applies middleware (auth, validation)
   - Delegates to services

2. **Services Layer** (`/services`)
   - Contains all business logic
   - Performs database operations
   - Handles data validation and transformation
   - Implements transaction management

3. **Database Layer** (`/db`)
   - SQLite connection management
   - Migration system
   - Database seeding
   - Query helpers with transaction support

4. **Middleware Layer** (`/middleware`)
   - Authentication (JWT)
   - Authorization (Admin checks)
   - Request validation (Joi)
   - Rate limiting
   - Input sanitization
   - Error handling
   - Request logging

5. **Frontend Layer** (`/pages`, `/public`)
   - Next.js React components
   - Client-side JavaScript (app.js)
   - Responsive UI with modals and forms

## 🔒 Security Features

### Implemented Security Measures

- **Helmet.js**: Sets secure HTTP headers with Content Security Policy
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

## 💰 Automatic Refund System

The system automatically processes refunds when events are deleted or inactivated:

- **Automatic Processing**: All confirmed bookings are refunded automatically
- **Status Updates**: Bookings are marked as `cancelled` with `payment_status = 'refunded'`
- **Seat Release**: Seats are released back to the event (if event is inactivated)
- **Audit Logging**: All refunds are logged for audit purposes

**Triggered When:**
- Event is soft deleted
- Event status is changed to `inactive`

## 📊 Admin Panel & Analytics

### Admin API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/overview` | GET | Dashboard statistics |
| `/api/admin/revenue` | GET | Total revenue + per-event breakdown |
| `/api/admin/popular-events` | GET | Top 5 most booked events |
| `/api/admin/user-stats` | GET | User activity statistics |
| `/api/admin/events/status` | GET | Active vs inactive events count |
| `/api/admin/events/:id/status` | PATCH | Update event status (triggers refunds if inactivating) |
| `/api/admin/events/:id` | DELETE | Soft delete event (triggers refunds) |
| `/api/admin/users` | POST | Create admin/user account |
| `/api/admin/most-popular-event` | GET | Most popular event details |

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
- **Morgan**: HTTP request logging (legacy)
- **Custom Logger**: Business logic logging (bookings, admin actions, refunds)

### Log Levels

- `error`: Errors and exceptions
- `warn`: Warnings (cancellations, refunds, etc.)
- `info`: General information (bookings, server start)
- `debug`: Debug information (development only)

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

**POST** `/api/events/create`
- Create new event (Admin only)
- Requires: Authentication, Admin role

**PUT** `/api/events/:id`
- Update event (Admin only)
- Requires: Authentication, Admin role

**DELETE** `/api/admin/events/:id`
- Soft delete event (Admin only)
- **Automatically refunds all confirmed bookings**
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
- **Automatically refunds bookings if status changed to 'inactive' or 'deleted'**
- Body: `{ status }`
- Requires: Authentication, Admin role

**DELETE** `/api/admin/events/:id`
- Soft delete event
- **Automatically refunds all confirmed bookings**
- Requires: Authentication, Admin role

**POST** `/api/admin/users`
- Create user/admin account
- Body: `{ full_name, email, username, password, phone?, role }`
- Requires: Authentication, Admin role

**GET** `/api/admin/most-popular-event`
- Get most popular event details
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

## 🐛 Recent Fixes & Improvements

- ✅ **Next.js Migration**: Converted from Express to Next.js framework
- ✅ **Image Loading**: Fixed event images with proper fallback handling and error recovery
- ✅ **Timestamp Formatting**: Fixed booking timestamps using SQLite's `datetime()` function
- ✅ **Automatic Refunds**: Implemented automatic refund system for deleted/inactivated events
- ✅ **Content Security Policy**: Configured Helmet CSP to allow external images
- ✅ **Error Handling**: Enhanced image loading with error handlers and fade-in effects
- ✅ **Express 5 Compatibility**: Fixed middleware compatibility issues with Express 5

## 📦 Dependencies

### Production

- `next`: Next.js framework (v14.2.33)
- `react`: React library (v18.3.1)
- `react-dom`: React DOM (v18.3.1)
- `better-sqlite3`: SQLite database driver (v11.10.0)
- `bcryptjs`: Password hashing (v3.0.3)
- `jsonwebtoken`: JWT authentication (v9.0.2)
- `joi`: Request validation (v17.13.3)
- `winston`: Application logging (v3.14.2)
- `dotenv`: Environment variable management (v17.2.3)

### Development

- `nodemon`: Development server with hot reload
- `typescript`: TypeScript support
- `@types/node`, `@types/react`, `@types/react-dom`: TypeScript type definitions

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

## 🔧 Environment Variables

**Required:**
- `JWT_SECRET`: Secret key for JWT tokens (no fallback)

**Optional:**
- `PORT`: Server port (default: 3000 for Next.js)
- `NODE_ENV`: Environment (development/production)
- `DB_PATH`: SQLite database path
- `CORS_ORIGINS`: Comma-separated allowed origins
- `RATE_LIMIT_WINDOW_MS`: Rate limit window (default: 15 minutes)
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window (default: 200)
- `SEAT_LOCK_TTL_MS`: Seat lock expiration (default: 5 minutes)
- `SEAT_LOCK_SWEEP_MS`: Lock cleanup interval (default: 1 minute)

## 📁 Project Structure

```
Ticket-Booker-System/
├── pages/                      # Next.js pages and API routes
│   ├── api/                    # API route handlers
│   │   ├── auth/               # Authentication endpoints
│   │   ├── events/             # Event endpoints
│   │   ├── bookings/           # Booking endpoints
│   │   ├── feedback/           # Feedback endpoints
│   │   └── admin/              # Admin endpoints
│   ├── _app.js                 # Next.js App component
│   ├── _document.js            # Next.js Document component
│   └── index.js                # Main frontend page
├── public/                     # Static assets
│   ├── app.js                  # Frontend JavaScript
│   ├── style.css               # Frontend styles
│   └── index.html              # Legacy HTML (if exists)
├── src/                        # Backend source code
│   ├── services/               # Business logic
│   │   ├── auth.service.js
│   │   ├── event.service.js
│   │   ├── booking.service.js
│   │   ├── feedback.service.js
│   │   ├── admin.service.js
│   │   ├── seatLock.service.js
│   │   └── user.service.js
│   ├── middleware/             # Express middleware
│   │   ├── auth.middleware.js
│   │   ├── admin.middleware.js
│   │   ├── validation.middleware.js
│   │   ├── rateLimit.middleware.js
│   │   ├── sanitize.middleware.js
│   │   ├── logger.middleware.js
│   │   └── error.middleware.js
│   ├── db/                     # Database layer
│   │   ├── connection.js
│   │   ├── index.js
│   │   ├── migrations/
│   │   │   └── 001_init.js
│   │   └── seed.js
│   ├── utils/                  # Utilities
│   │   ├── config.js
│   │   ├── jwt.js
│   │   ├── logger.js
│   │   ├── errors.js
│   │   ├── response.js
│   │   └── seatUtils.js
│   ├── validators/             # Joi schemas
│   │   ├── auth.validator.js
│   │   ├── event.validator.js
│   │   ├── booking.validator.js
│   │   ├── feedback.validator.js
│   │   └── admin.validator.js
│   └── lib/                    # Next.js helpers
│       └── api-helpers.js
├── next.config.js              # Next.js configuration
├── package.json
├── .gitignore
├── README.md                   # Running instructions
└── About_Project.md            # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

ISC

**Version**: 1.0.0  
**Last Updated**: November 2024

