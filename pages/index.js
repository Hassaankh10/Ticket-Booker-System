import { useEffect } from 'react';
import Head from 'next/head';
import Script from 'next/script';

export default function Home() {
  useEffect(() => {
    // Database initialization happens server-side via API route
    fetch('/api/init-db').catch(() => {
      // Silently fail if already initialized
    });

    // Initialize the app after React hydration
    const initApp = () => {
      if (typeof window !== 'undefined' && window.TicketBookerApp) {
        if (!window.app) {
          window.app = new window.TicketBookerApp();
        }
      } else {
        // If script hasn't loaded yet, wait for it
        const checkInterval = setInterval(() => {
          if (typeof window !== 'undefined' && window.TicketBookerApp) {
            if (!window.app) {
              window.app = new window.TicketBookerApp();
            }
            clearInterval(checkInterval);
          }
        }, 100);
        
        // Clear interval after 5 seconds
        setTimeout(() => clearInterval(checkInterval), 5000);
      }
    };

    // Try to initialize immediately
    initApp();
    
    // Also try after a short delay to ensure DOM is ready
    const timeout = setTimeout(initApp, 100);
    
    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      <Head>
        <title>TicketBooker - Online Event Booking System</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta charSet="UTF-8" />
      </Head>
      <div id="app-root">
        <header className="header">
          <div className="container">
            <div className="header__content">
              <div className="header__logo">
                <h2>TicketBooker</h2>
              </div>
              <nav className="header__nav">
                <a href="#home" className="nav-link" data-page="home">Home</a>
                <a href="#events" className="nav-link" data-page="events">Events</a>
                <div className="header__auth">
                  <div className="auth-buttons">
                    <button className="btn btn--outline btn--sm" id="loginBtn">Login</button>
                    <button className="btn btn--primary btn--sm" id="registerBtn">Register</button>
                  </div>
                  <div className="user-menu hidden">
                    <span className="user-name"></span>
                    <button className="btn btn--outline btn--sm" id="dashboardBtn">Dashboard</button>
                    <button className="btn btn--outline btn--sm" id="adminBtn">Admin Panel</button>
                    <button className="btn btn--outline btn--sm" id="logoutBtn">Logout</button>
                  </div>
                </div>
              </nav>
            </div>
          </div>
        </header>
        <main className="main">
          <div id="homePage" className="page active">
            <section className="hero">
              <div className="container">
                <div className="hero__content">
                  <h1>Book Your Tickets Online</h1>
                  <p>Discover amazing events and book tickets instantly</p>
                  <button className="btn btn--primary btn--lg" onClick={() => window.navigateToPage?.('events')}>Browse Events</button>
                </div>
              </div>
            </section>
            <section className="featured-events">
              <div className="container">
                <h2>Featured Events</h2>
                <div className="events-grid" id="featuredEventsGrid"></div>
              </div>
            </section>
          </div>
          <div id="eventsPage" className="page">
            <div className="container">
              <div className="page-header">
                <h1>All Events</h1>
                <div className="search-filters">
                  <div className="search-box">
                    <input type="text" id="eventSearch" className="form-control" placeholder="Search events..." />
                  </div>
                  <select id="eventTypeFilter" className="form-control">
                    <option value="">All Categories</option>
                    <option value="Concert">Concert</option>
                    <option value="Food Festival">Food Festival</option>
                    <option value="Conference">Conference</option>
                    <option value="Sports">Sports</option>
                    <option value="Entertainment">Entertainment</option>
                  </select>
                </div>
              </div>
              <div className="events-grid" id="allEventsGrid"></div>
            </div>
          </div>
          <div id="eventDetailsPage" className="page">
            <div className="container">
              <div id="eventDetailsContent"></div>
            </div>
          </div>
          <div id="dashboardPage" className="page">
            <div className="container">
              <h1>My Dashboard</h1>
              <div className="dashboard-content">
                <div className="dashboard-section">
                  <h3>My Bookings</h3>
                  <div id="userBookings"></div>
                </div>
                <div className="dashboard-section">
                  <h3>Share Feedback</h3>
                  <form id="feedbackForm">
                    <select id="feedbackEvent" className="form-control"></select>
                    <select id="feedbackRating" className="form-control">
                      <option value="">No rating</option>
                      <option value="5">5 - Loved it</option>
                      <option value="4">4 - Great</option>
                      <option value="3">3 - It was ok</option>
                      <option value="2">2 - Needs work</option>
                      <option value="1">1 - Not happy</option>
                    </select>
                    <select id="feedbackCategory" className="form-control">
                      <option value="general">General</option>
                      <option value="complaint">Complaint</option>
                      <option value="suggestion">Suggestion</option>
                    </select>
                    <textarea id="feedbackMessage" className="form-control" rows="4" required></textarea>
                    <button type="submit" className="btn btn--primary">Submit Feedback</button>
                  </form>
                </div>
                <div className="dashboard-section">
                  <h3>My Feedback</h3>
                  <div id="userFeedbackList" className="feedback-list"></div>
                </div>
              </div>
            </div>
          </div>
          <div id="adminPage" className="page">
            <div className="container">
              <h1>Admin Panel</h1>
              <div className="admin-content">
                <div className="admin-section">
                  <h3>Operations Overview</h3>
                  <div id="adminOverview" className="analytics-grid"></div>
                </div>
                <div className="admin-section">
                  <div className="admin-section-header">
                    <h3>Event Management</h3>
                    <button className="btn btn--primary btn--sm" id="addEventBtn">Add New Event</button>
                  </div>
                  <div id="adminEvents"></div>
                </div>
                <div className="admin-section">
                  <h3>Booking Reports</h3>
                  <div id="bookingReports"></div>
                </div>
                <div className="admin-section">
                  <div className="admin-section-header">
                    <h3>Feedback Center</h3>
                    <span className="badge" id="feedbackStatusCount"></span>
                  </div>
                  <div id="feedbackTable"></div>
                </div>
                <div className="admin-section">
                  <h3>Team Management</h3>
                  <form id="adminUserForm">
                    <div className="form-row">
                      <input type="text" id="adminFullName" className="form-control" placeholder="Full Name" required />
                      <input type="email" id="adminEmail" className="form-control" placeholder="Email" required />
                    </div>
                    <div className="form-row">
                      <input type="text" id="adminUsername" className="form-control" placeholder="Username" required />
                      <input type="tel" id="adminPhone" className="form-control" placeholder="Phone (Optional)" />
                    </div>
                    <div className="form-row">
                      <input type="password" id="adminPassword" className="form-control" placeholder="Password" required />
                      <select id="adminRole" className="form-control" required>
                        <option value="admin">Admin</option>
                        <option value="customer">Customer</option>
                      </select>
                    </div>
                    <button type="submit" className="btn btn--primary btn--sm">Create Team Member</button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </main>
        <div id="loginModal" className="modal hidden">
          <div className="modal__overlay"></div>
          <div className="modal__content">
            <div className="modal__header">
              <h3>Login</h3>
              <button className="modal__close">&times;</button>
            </div>
            <div className="modal__body">
              <form id="loginForm">
                <div className="form-group">
                  <label className="form-label" htmlFor="loginEmail">Email</label>
                  <input type="email" id="loginEmail" className="form-control" required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="loginPassword">Password</label>
                  <input type="password" id="loginPassword" className="form-control" required />
                </div>
                <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
                  <a href="#" id="forgotPasswordLink" style={{ color: '#007bff', textDecoration: 'none', fontSize: '0.9rem' }}>
                    Forgot Password?
                  </a>
                </div>
                <button type="submit" className="btn btn--primary btn--full-width">Login</button>
              </form>
            </div>
          </div>
        </div>
        <div id="forgotPasswordModal" className="modal hidden">
          <div className="modal__overlay"></div>
          <div className="modal__content">
            <div className="modal__header">
              <h3>Forgot Password</h3>
              <button className="modal__close">&times;</button>
            </div>
            <div className="modal__body">
              <p style={{ marginBottom: '1rem', color: '#666' }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <form id="forgotPasswordForm">
                <div className="form-group">
                  <label className="form-label" htmlFor="forgotPasswordEmail">Email</label>
                  <input type="email" id="forgotPasswordEmail" className="form-control" required />
                </div>
                <button type="submit" className="btn btn--primary btn--full-width">Send Reset Link</button>
                <button type="button" className="btn btn--outline btn--full-width" style={{ marginTop: '0.5rem' }} id="backToLoginBtn">
                  Back to Login
                </button>
              </form>
            </div>
          </div>
        </div>
        <div id="resetPasswordModal" className="modal hidden">
          <div className="modal__overlay"></div>
          <div className="modal__content">
            <div className="modal__header">
              <h3>Reset Password</h3>
              <button className="modal__close">&times;</button>
            </div>
            <div className="modal__body">
              <form id="resetPasswordForm">
                <div className="form-group">
                  <label className="form-label" htmlFor="resetPasswordToken">Reset Token</label>
                  <input type="text" id="resetPasswordToken" className="form-control" placeholder="Enter reset token from email" required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="resetPasswordNew">New Password</label>
                  <input type="password" id="resetPasswordNew" className="form-control" minLength="8" required />
                  <small style={{ color: '#666', fontSize: '0.85rem' }}>Password must be at least 8 characters long</small>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="resetPasswordConfirm">Confirm Password</label>
                  <input type="password" id="resetPasswordConfirm" className="form-control" minLength="8" required />
                </div>
                <button type="submit" className="btn btn--primary btn--full-width">Reset Password</button>
                <button type="button" className="btn btn--outline btn--full-width" style={{ marginTop: '0.5rem' }} id="backToLoginFromResetBtn">
                  Back to Login
                </button>
              </form>
            </div>
          </div>
        </div>
        <div id="registerModal" className="modal hidden">
          <div className="modal__overlay"></div>
          <div className="modal__content">
            <div className="modal__header">
              <h3>Register</h3>
              <button className="modal__close">&times;</button>
            </div>
            <div className="modal__body">
              <form id="registerForm">
                <div className="form-group">
                  <label className="form-label" htmlFor="regFullName">Full Name</label>
                  <input type="text" id="regFullName" className="form-control" required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="regEmail">Email</label>
                  <input type="email" id="regEmail" className="form-control" required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="regPhone">Phone</label>
                  <input type="tel" id="regPhone" className="form-control" required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="regUsername">Username</label>
                  <input type="text" id="regUsername" className="form-control" required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="regPassword">Password</label>
                  <input type="password" id="regPassword" className="form-control" required />
                </div>
                <button type="submit" className="btn btn--primary btn--full-width">Register</button>
              </form>
            </div>
          </div>
        </div>
        <div id="bookingModal" className="modal hidden">
          <div className="modal__overlay"></div>
          <div className="modal__content">
            <div className="modal__header">
              <h3>Book Tickets</h3>
              <button className="modal__close">&times;</button>
            </div>
            <div className="modal__body">
              <div id="bookingContent"></div>
            </div>
          </div>
        </div>
        <div id="eventModal" className="modal hidden">
          <div className="modal__overlay"></div>
          <div className="modal__content modal__content--large">
            <div className="modal__header">
              <h3 id="eventModalTitle">Add New Event</h3>
              <button className="modal__close">&times;</button>
            </div>
            <div className="modal__body">
              <form id="eventForm">
                <div className="form-row">
                  <input type="text" id="eventName" className="form-control" placeholder="Event Name" required />
                  <select id="eventType" className="form-control" required>
                    <option value="">Select Type</option>
                    <option value="Concert">Concert</option>
                    <option value="Food Festival">Food Festival</option>
                    <option value="Conference">Conference</option>
                  </select>
                </div>
                <div className="form-row">
                  <input type="text" id="eventVenue" className="form-control" placeholder="Venue" required />
                  <input type="date" id="eventDate" className="form-control" required />
                </div>
                <div className="form-row">
                  <input type="time" id="eventTime" className="form-control" required />
                  <input type="number" id="eventPrice" className="form-control" placeholder="Price (PKR)" required />
                </div>
                <div className="form-row">
                  <input type="number" id="totalSeats" className="form-control" placeholder="Total Seats" required />
                  <select id="eventStatus" className="form-control" required>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <input type="url" id="eventImage" className="form-control" placeholder="Image URL (Optional)" />
                <textarea id="eventDescription" className="form-control" rows="4" placeholder="Description" required></textarea>
                <div className="form-actions">
                  <button type="button" className="btn btn--outline" id="cancelEventBtn">Cancel</button>
                  <button type="submit" className="btn btn--primary">Save Event</button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div id="deleteModal" className="modal hidden">
          <div className="modal__overlay"></div>
          <div className="modal__content">
            <div className="modal__header">
              <h3>Confirm Delete</h3>
              <button className="modal__close">&times;</button>
            </div>
            <div className="modal__body">
              <p>Are you sure you want to delete this event? This action cannot be undone.</p>
              <div className="form-actions">
                <button type="button" className="btn btn--outline" id="cancelDeleteBtn">Cancel</button>
                <button type="button" className="btn btn--primary btn--danger" id="confirmDeleteBtn">Delete Event</button>
              </div>
            </div>
          </div>
        </div>
        <div id="cancelBookingModal" className="modal hidden">
          <div className="modal__overlay"></div>
          <div className="modal__content">
            <div className="modal__header">
              <h3>Cancel Booking</h3>
              <button className="modal__close">&times;</button>
            </div>
            <div className="modal__body">
              <p>Are you sure you want to cancel this booking? This action cannot be undone and seats will be released.</p>
              <div className="form-actions">
                <button type="button" className="btn btn--outline" id="cancelBookingCancelBtn">Keep Booking</button>
                <button type="button" className="btn btn--primary btn--danger" id="confirmCancelBookingBtn">Cancel Booking</button>
              </div>
            </div>
          </div>
        </div>
        <div id="toast" className="toast hidden">
          <div className="toast__message"></div>
        </div>
      </div>
      <Script 
        src="/app.js" 
        strategy="afterInteractive"
        onLoad={() => {
          // Initialize app after script loads
          if (typeof window !== 'undefined') {
            setTimeout(() => {
              if (window.TicketBookerApp && !window.app) {
                try {
                  window.app = new window.TicketBookerApp();
                  console.log('App initialized from Script onLoad');
                } catch (error) {
                  console.error('Error initializing app:', error);
                }
              }
            }, 200);
          }
        }}
        onError={(e) => {
          console.error('Error loading app.js:', e);
        }}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Fallback initialization
            (function() {
              function initApp() {
                if (window.TicketBookerApp && !window.app) {
                  try {
                    window.app = new window.TicketBookerApp();
                    console.log('App initialized from fallback script');
                  } catch (error) {
                    console.error('Error initializing app:', error);
                  }
                } else if (!window.TicketBookerApp) {
                  setTimeout(initApp, 100);
                }
              }
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initApp);
              } else {
                setTimeout(initApp, 100);
              }
            })();
          `,
        }}
      />
    </>
  );
}
