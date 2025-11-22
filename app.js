const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&h=600&fit=crop';

class ApiClient {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
    this.tokenKey = 'ticketBooker_token';
    this.token = localStorage.getItem(this.tokenKey);
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem(this.tokenKey, token);
    } else {
      localStorage.removeItem(this.tokenKey);
    }
  }

  clearToken() {
    this.setToken(null);
  }

  async request(endpoint, options = {}) {
    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    if (options.body && config.method !== 'GET') {
      config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);
    if (!response.ok) {
      let message = 'Request failed';
      try {
        const errorBody = await response.json();
        message = errorBody.message || message;
      } catch (error) {
        // ignore
      }
      throw new Error(message);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  login(payload) {
    return this.request('/auth/login', { method: 'POST', body: payload });
  }

  register(payload) {
    return this.request('/auth/register', { method: 'POST', body: payload });
  }

  getProfile() {
    return this.request('/auth/profile');
  }

  getEvents({ includeInactive = false, status } = {}) {
    const params = new URLSearchParams();
    if (includeInactive) params.set('includeInactive', 'true');
    if (status) params.set('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/events${query}`);
  }

  getEventById(id) {
    return this.request(`/events/${id}`);
  }

  createEvent(data) {
    return this.request('/events', { method: 'POST', body: data });
  }

  updateEvent(id, data) {
    return this.request(`/events/${id}`, { method: 'PUT', body: data });
  }

  deleteEvent(id) {
    return this.request(`/events/${id}`, { method: 'DELETE' });
  }

  getBookings(scope = 'user') {
    const params = scope === 'all' ? '?scope=all' : '';
    return this.request(`/bookings${params}`);
  }

  createBooking(payload) {
    return this.request('/bookings', { method: 'POST', body: payload });
  }

  cancelBooking(id) {
    return this.request(`/bookings/${id}/cancel`, { method: 'PATCH' });
  }

  submitFeedback(payload) {
    return this.request('/feedback', { method: 'POST', body: payload });
  }

  getFeedback(scope = 'all') {
    const params = scope ? `?scope=${scope}` : '';
    return this.request(`/feedback${params}`);
  }

  updateFeedbackStatus(id, status) {
    return this.request(`/feedback/${id}`, { method: 'PATCH', body: { status } });
  }

  createAdminUser(payload) {
    return this.request('/admin/users', { method: 'POST', body: payload });
  }

  getAdminOverview() {
    return this.request('/admin/overview');
  }
}

class EngagementTracker {
  constructor() {
    this.storageKey = 'ticketBooker_analytics';
    const snapshot = localStorage.getItem(this.storageKey);
    this.data = snapshot
      ? JSON.parse(snapshot)
      : {
          pageViews: {},
          eventViews: {},
          totalVisitors: 0,
          conversionData: { totalViews: 0, totalBookings: 0 },
        };
  }

  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
  }

  trackPage(page) {
    this.data.pageViews[page] = (this.data.pageViews[page] || 0) + 1;
    this.data.totalVisitors += 1;
    this.save();
  }

  trackEvent(eventId) {
    this.data.eventViews[eventId] = (this.data.eventViews[eventId] || 0) + 1;
    this.data.conversionData.totalViews += 1;
    this.save();
  }

  recordBooking() {
    this.data.conversionData.totalBookings += 1;
    this.save();
  }

  getSummary() {
    return this.data;
  }
}

class AppState {
  constructor(api) {
    this.api = api;
    this.sessionKey = 'ticketBooker_session';
    this.currentUser = null;
  }

  async restoreSession() {
    const cached = localStorage.getItem(this.sessionKey);
    if (cached && this.api.token) {
      try {
        const { user } = await this.api.getProfile();
        this.currentUser = user;
        localStorage.setItem(this.sessionKey, JSON.stringify(user));
      } catch (error) {
        this.logout(true);
      }
    } else {
      this.logout(true);
    }
  }

  login(user, token) {
    this.currentUser = user;
    this.api.setToken(token);
    localStorage.setItem(this.sessionKey, JSON.stringify(user));
  }

  logout(silent = false) {
    this.currentUser = null;
    this.api.clearToken();
    localStorage.removeItem(this.sessionKey);
    if (!silent) {
      localStorage.removeItem('ticketBooker_token');
    }
  }

  isLoggedIn() {
    return Boolean(this.currentUser);
  }

  isAdmin() {
    return this.currentUser?.role === 'admin';
  }
}

class TicketBookerApp {
  constructor() {
    this.api = new ApiClient('/api');
    this.analytics = new EngagementTracker();
    this.state = new AppState(this.api);
    this.eventsCache = [];
    this.bookingsCache = [];
    this.feedbackCache = [];
    this.selectedEvent = null;
    this.currentEditingEventId = null;
    this.eventToDelete = null;
    this.bookingToCancel = null;
    this.currentPage = 'home';
    this.init();
  }

  async init() {
    await this.state.restoreSession();
    await this.refreshEvents();
    this.setupEventListeners();
    this.setupBrowserNavigation();
    
    // Check URL hash on initial load
    const initialPage = this.getPageFromHash() || 'home';
    await this.navigateToPage(initialPage, false);
    this.updateUI();
  }

  setupBrowserNavigation() {
    // Handle browser back/forward buttons
    window.addEventListener('popstate', (event) => {
      const page = event.state?.page || this.getPageFromHash() || 'home';
      this.navigateToPage(page, false);
    });
  }

  getPageFromHash() {
    const hash = window.location.hash.slice(1); // Remove the '#'
    return hash || null;
  }

  setupEventListeners() {
    document.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.getAttribute('data-page');
        this.navigateToPage(page);
      });
    });

    this.bindAuthForms();
    this.bindModalControls();
    this.bindEventForms();
    this.bindFeedbackForm();
    this.bindAdminUserForm();

    const browseEventsBtn = document.querySelector('.hero .btn');
    if (browseEventsBtn) {
      browseEventsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigateToPage('events');
      });
    }
  }

  bindAuthForms() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const dashboardBtn = document.getElementById('dashboardBtn');
    const adminBtn = document.getElementById('adminBtn');

    loginBtn?.addEventListener('click', () => this.showLoginModal());
    registerBtn?.addEventListener('click', () => this.showRegisterModal());
    logoutBtn?.addEventListener('click', () => this.logout());
    dashboardBtn?.addEventListener('click', () => this.navigateToPage('dashboard'));
    adminBtn?.addEventListener('click', () => this.navigateToPage('admin'));

    const loginForm = document.getElementById('loginForm');
    loginForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      try {
        const { token, user } = await this.api.login({ email, password });
        this.state.login(user, token);
        this.hideModals();
        this.updateUI();
        this.showToast('Welcome back!', 'success');
        loginForm.reset();
      } catch (error) {
        this.showToast(error.message, 'error');
      }
    });

    const registerForm = document.getElementById('registerForm');
    registerForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        full_name: document.getElementById('regFullName').value,
        email: document.getElementById('regEmail').value,
        phone: document.getElementById('regPhone').value,
        username: document.getElementById('regUsername').value,
        password: document.getElementById('regPassword').value,
      };

      try {
        await this.api.register(payload);
        this.showToast('Registration successful. Please log in.', 'success');
        this.hideModals();
        registerForm.reset();
        this.showLoginModal();
      } catch (error) {
        this.showToast(error.message, 'error');
      }
    });
  }

  bindModalControls() {
    document.querySelectorAll('.modal__close').forEach((btn) => {
      btn.addEventListener('click', () => this.hideModals());
    });
    document.querySelectorAll('.modal__overlay').forEach((overlay) => {
      overlay.addEventListener('click', () => this.hideModals());
    });

    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    cancelDeleteBtn?.addEventListener('click', () => this.hideModals());
    confirmDeleteBtn?.addEventListener('click', () => this.confirmDeleteEvent());

    const cancelBookingCancelBtn = document.getElementById('cancelBookingCancelBtn');
    const confirmCancelBookingBtn = document.getElementById('confirmCancelBookingBtn');
    cancelBookingCancelBtn?.addEventListener('click', () => this.hideModals());
    confirmCancelBookingBtn?.addEventListener('click', () => this.confirmCancelBooking());
  }

  bindEventForms() {
    const addEventBtn = document.getElementById('addEventBtn');
    addEventBtn?.addEventListener('click', () => this.showEventModal());

    const eventForm = document.getElementById('eventForm');
    eventForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleEventForm();
    });

    const cancelEventBtn = document.getElementById('cancelEventBtn');
    cancelEventBtn?.addEventListener('click', () => this.hideModals());
  }

  bindFeedbackForm() {
    const feedbackForm = document.getElementById('feedbackForm');
    feedbackForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.submitFeedback();
    });
  }

  bindAdminUserForm() {
    const adminUserForm = document.getElementById('adminUserForm');
    adminUserForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        full_name: document.getElementById('adminFullName').value,
        email: document.getElementById('adminEmail').value,
        username: document.getElementById('adminUsername').value,
        phone: document.getElementById('adminPhone').value,
        password: document.getElementById('adminPassword').value,
        role: document.getElementById('adminRole').value,
      };

      try {
        await this.api.createAdminUser(payload);
        this.showToast('Team member created.', 'success');
        adminUserForm.reset();
      } catch (error) {
        this.showToast(error.message, 'error');
      }
    });
  }

  async refreshEvents(includeInactive = false) {
    try {
      this.eventsCache = await this.api.getEvents({ includeInactive });
    } catch (error) {
      this.showToast(error.message, 'error');
    }
  }

  async navigateToPage(page, updateHistory = true) {
    if (!page) return;
    try {
      if (page === 'dashboard' && !this.state.isLoggedIn()) {
        this.showLoginModal();
        return;
      }
      if (page === 'admin' && !this.state.isAdmin()) {
        this.showToast('Admin access required.', 'error');
        this.navigateToPage('home', updateHistory);
        return;
      }

      document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
      const target = document.getElementById(`${page}Page`);
      target?.classList.add('active');
      this.currentPage = page;
      this.analytics.trackPage(page);
      
      // Update browser history and URL hash
      if (updateHistory) {
        const url = `#${page}`;
        window.history.pushState({ page }, '', url);
      }
      
      this.updateUI();

      switch (page) {
        case 'home':
          await this.loadHomePage();
          break;
        case 'events':
          await this.loadEventsPage();
          break;
        case 'dashboard':
          await this.loadDashboard();
          break;
        case 'admin':
          await this.loadAdminPanel();
          break;
        default:
          break;
      }
    } catch (error) {
      this.showToast(error.message, 'error');
    }
  }

  updateUI() {
    const authButtons = document.querySelector('.auth-buttons');
    const userMenu = document.querySelector('.user-menu');
    const adminBtn = document.getElementById('adminBtn');

    if (this.state.isLoggedIn()) {
      authButtons?.classList.add('hidden');
      userMenu?.classList.remove('hidden');
      const userNameEl = document.querySelector('.user-name');
      if (userNameEl) userNameEl.textContent = this.state.currentUser.full_name;
      if (adminBtn) {
        adminBtn.classList.toggle('hidden', !this.state.isAdmin());
      }
    } else {
      authButtons?.classList.remove('hidden');
      userMenu?.classList.add('hidden');
      if (adminBtn) adminBtn.classList.add('hidden');
    }

    document.querySelectorAll('.nav-link').forEach((link) => {
      link.classList.toggle('active', link.getAttribute('data-page') === this.currentPage);
    });
  }

  async loadHomePage() {
    if (!this.eventsCache.length) {
      await this.refreshEvents();
    }
    const events = this.eventsCache.filter((event) => event.status === 'active');
    const highlighted = [...events]
      .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
      .slice(0, 3);
    this.renderEvents(highlighted, 'featuredEventsGrid');
  }

  async loadEventsPage() {
    if (!this.eventsCache.length) {
      await this.refreshEvents(true);
    }
    const searchInput = document.getElementById('eventSearch');
    const filterSelect = document.getElementById('eventTypeFilter');

    const filterEvents = () => {
      const searchTerm = searchInput.value.toLowerCase();
      const type = filterSelect.value;
      const filtered = this.eventsCache.filter((event) => {
        const matchesSearch =
          event.event_name.toLowerCase().includes(searchTerm) ||
          event.description?.toLowerCase().includes(searchTerm) ||
          event.venue.toLowerCase().includes(searchTerm);
        const matchesType = !type || event.event_type === type;
        return matchesSearch && matchesType && event.status === 'active';
      });
      this.renderEvents(filtered, 'allEventsGrid');
    };

    searchInput?.addEventListener('input', filterEvents);
    filterSelect?.addEventListener('change', filterEvents);
    filterEvents();
  }

  renderEvents(events, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!events.length) {
      container.innerHTML = '<p class="loading">No events found.</p>';
      return;
    }

    container.innerHTML = events
      .map((event) => this.createEventCard(event))
      .join('');

    container.querySelectorAll('.event-card').forEach((card) => {
      card.addEventListener('click', () => {
        const eventId = card.getAttribute('data-event-id');
        this.showEventDetails(eventId);
      });
    });
  }

  createEventCard(event) {
    return `
      <div class="event-card" data-event-id="${event.event_id}">
        <img src="${event.banner_url || PLACEHOLDER_IMAGE}" alt="${event.event_name}" class="event-card__image" />
        <div class="event-card__content">
          <div class="event-card__header">
            <h3 class="event-card__title">${event.event_name}</h3>
            <span class="event-card__type">${event.event_type}</span>
          </div>
          <div class="event-card__details">
            <div class="event-detail"><strong>Date:</strong> ${this.formatDate(event.event_date)}</div>
            <div class="event-detail"><strong>Time:</strong> ${event.event_time}</div>
            <div class="event-detail"><strong>Venue:</strong> ${event.venue}</div>
          </div>
          <div class="event-card__footer">
            <span class="event-price">PKR ${Number(event.price_per_ticket).toLocaleString()}</span>
            <span class="event-availability">${event.available_seats} seats left</span>
          </div>
        </div>
      </div>
    `;
  }

  async showEventDetails(eventId) {
    try {
      const event = await this.api.getEventById(eventId);
      this.analytics.trackEvent(eventId);
      this.selectedEvent = event;
      const container = document.getElementById('eventDetailsContent');
      container.innerHTML = `
        <div class="event-details">
          <div class="event-details__header">
            <img src="${event.banner_url || PLACEHOLDER_IMAGE}" alt="${event.event_name}" class="event-details__image" />
            <h1 class="event-details__title">${event.event_name}</h1>
            <span class="event-card__type">${event.event_type}</span>
          </div>
          <div class="event-details__info">
            <div class="info-item"><div class="info-item__label">Date</div><div class="info-item__value">${this.formatDate(event.event_date)}</div></div>
            <div class="info-item"><div class="info-item__label">Time</div><div class="info-item__value">${event.event_time}</div></div>
            <div class="info-item"><div class="info-item__label">Venue</div><div class="info-item__value">${event.venue}</div></div>
            <div class="info-item"><div class="info-item__label">Price</div><div class="info-item__value">PKR ${Number(event.price_per_ticket).toLocaleString()}</div></div>
          </div>
          <div class="event-details__description">
            <h3>About This Event</h3>
            <p>${event.description || 'Details coming soon.'}</p>
          </div>
          <div class="event-details__actions">
            <button class="btn btn--primary btn--lg" id="bookTicketsBtn">Book Tickets</button>
            <button class="btn btn--outline btn--lg" id="backToEventsBtn">Back to Events</button>
          </div>
        </div>
      `;

      document.getElementById('bookTicketsBtn')?.addEventListener('click', () => {
        if (!this.state.isLoggedIn()) {
          this.showLoginModal();
          return;
        }
        this.showBookingModal();
      });

      document.getElementById('backToEventsBtn')?.addEventListener('click', () => {
        this.navigateToPage('events');
      });

      this.navigateToPage('eventDetails');
    } catch (error) {
      this.showToast(error.message, 'error');
    }
  }

  showBookingModal() {
    if (!this.selectedEvent) return;
    const modal = document.getElementById('bookingModal');
    const content = document.getElementById('bookingContent');
    const event = this.selectedEvent;
    content.innerHTML = `
      <form class="booking-form" id="ticketBookingForm">
        <div class="booking-summary">
          <h4>Booking Summary</h4>
          <div class="summary-row"><span>Event:</span><span>${event.event_name}</span></div>
          <div class="summary-row"><span>Price per ticket:</span><span>PKR ${Number(event.price_per_ticket).toLocaleString()}</span></div>
          <div class="summary-row">
            <span>Quantity:</span>
            <div class="quantity-selector">
              <button type="button" class="quantity-btn" id="decreaseQty">-</button>
              <input type="number" class="quantity-input" id="ticketQuantity" value="1" min="1" max="10">
              <button type="button" class="quantity-btn" id="increaseQty">+</button>
            </div>
          </div>
          <div class="summary-row" id="discountRow" style="display:none;">
            <span>Discount:</span><span id="discountAmount">PKR 0</span>
          </div>
          <div class="summary-row"><span>Total Amount:</span><span id="totalAmount">PKR ${Number(event.price_per_ticket).toLocaleString()}</span></div>
        </div>
        <div class="form-group">
          <label class="form-label">Available Seats: ${event.available_seats}</label>
        </div>
        <button type="submit" class="btn btn--primary btn--full-width">Confirm Booking</button>
      </form>
    `;

    modal.classList.remove('hidden');
    this.setupBookingForm();
  }

  setupBookingForm() {
    const quantityInput = document.getElementById('ticketQuantity');
    const decreaseBtn = document.getElementById('decreaseQty');
    const increaseBtn = document.getElementById('increaseQty');
    const bookingForm = document.getElementById('ticketBookingForm');

    const updateTotal = () => {
      const quantity = Math.min(
        Math.max(parseInt(quantityInput.value, 10) || 1, 1),
        Math.min(10, this.selectedEvent.available_seats)
      );
      quantityInput.value = quantity;
      const total = Number(this.selectedEvent.price_per_ticket) * quantity;
      document.getElementById('totalAmount').textContent = `PKR ${total.toLocaleString()}`;
    };

    decreaseBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      quantityInput.value = Math.max(parseInt(quantityInput.value, 10) - 1, 1);
      updateTotal();
    });

    increaseBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      quantityInput.value = Math.min(
        parseInt(quantityInput.value, 10) + 1,
        Math.min(10, this.selectedEvent.available_seats)
      );
      updateTotal();
    });

    quantityInput?.addEventListener('input', updateTotal);
    bookingForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.processBooking();
    });
  }

  async processBooking() {
    if (!this.selectedEvent) return;
    const quantity = parseInt(document.getElementById('ticketQuantity').value, 10) || 1;
    try {
      await this.api.createBooking({ event_id: this.selectedEvent.event_id, num_tickets: quantity });
      this.analytics.recordBooking();
      this.hideModals();
      this.showToast('Booking confirmed!', 'success');
      await this.refreshEvents(true);
      if (this.currentPage === 'dashboard') {
        await this.loadDashboard();
      } else {
        await this.loadEventsPage();
      }
    } catch (error) {
      this.showToast(error.message, 'error');
    }
  }

  async loadDashboard() {
    await Promise.all([this.loadUserBookings(), this.populateFeedbackForm(), this.loadUserFeedback()]);
  }

  async loadUserBookings() {
    try {
      this.bookingsCache = await this.api.getBookings();
      const container = document.getElementById('userBookings');
      if (!this.bookingsCache.length) {
        container.innerHTML = '<p class="loading">No bookings found.</p>';
        return;
      }
      container.innerHTML = this.bookingsCache.map((booking) => this.createBookingCard(booking)).join('');
    } catch (error) {
      this.showToast(error.message, 'error');
    }
  }

  createBookingCard(booking) {
    const canCancel = booking.booking_status === 'confirmed';
    // Show 'refunded' if payment_status is 'refunded', otherwise show booking_status
    const displayStatus = booking.payment_status === 'refunded' ? 'refunded' : booking.booking_status;
    const statusClass = canCancel ? 'success' : 'warning';
    
    return `
      <div class="booking-card">
        <div class="booking-card__header">
          <div>
            <h4 class="booking-card__title">${booking.event_name}</h4>
            <span class="status status--${statusClass}">${displayStatus}</span>
          </div>
          <div>
            <strong>Booked on:</strong>
            <div>${this.formatDateTime(booking.booking_date)}</div>
          </div>
        </div>
        <div class="booking-card__details">
          <div class="booking-detail"><strong>Tickets:</strong> ${booking.num_tickets}</div>
          <div class="booking-detail"><strong>Total:</strong> PKR ${Number(booking.total_amount).toLocaleString()}</div>
          <div class="booking-detail"><strong>Seats:</strong> ${JSON.parse(booking.seat_numbers || '[]').join(', ')}</div>
        </div>
        ${canCancel ? `<div class="booking-card__actions"><button class="btn btn--outline btn--sm btn--danger" onclick="window.app.cancelBooking(${booking.booking_id})">Cancel Booking</button></div>` : ''}
      </div>
    `;
  }

  async populateFeedbackForm() {
    if (!this.eventsCache.length) {
      await this.refreshEvents();
    }
    const select = document.getElementById('feedbackEvent');
    if (!select) return;
    const options = this.eventsCache
      .filter((event) => event.status === 'active')
      .map((event) => `<option value="${event.event_id}">${event.event_name}</option>`)
      .join('');
    select.innerHTML = `<option value="">General platform feedback</option>${options}`;
  }

  async submitFeedback() {
    if (!this.state.isLoggedIn()) {
      this.showLoginModal();
      return;
    }
    const payload = {
      event_id: document.getElementById('feedbackEvent').value || null,
      rating: document.getElementById('feedbackRating').value || null,
      category: document.getElementById('feedbackCategory').value,
      message: document.getElementById('feedbackMessage').value.trim(),
    };
    if (!payload.message) {
      this.showToast('Please describe your feedback.', 'error');
      return;
    }
    try {
      await this.api.submitFeedback(payload);
      this.showToast('Thanks for sharing your feedback!', 'success');
      document.getElementById('feedbackForm').reset();
      await this.loadUserFeedback();
      if (this.state.isAdmin()) {
        await this.loadAdminPanel();
      }
    } catch (error) {
      this.showToast(error.message, 'error');
    }
  }

  async loadUserFeedback() {
    if (!this.state.isLoggedIn()) return;
    if (this.state.isAdmin()) {
      // Admin view uses dedicated section
      return;
    }
    try {
      const myFeedback = await this.api.getFeedback('mine');
      this.renderFeedbackList(myFeedback, 'userFeedbackList', false);
    } catch (error) {
      this.showToast(error.message, 'error');
    }
  }

  renderFeedbackList(items, containerId, includeActions = false) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!items.length) {
      container.innerHTML = '<p class="loading">No feedback yet.</p>';
      return;
    }
    container.innerHTML = items
      .map(
        (item) => `
        <div class="feedback-item">
          <div class="feedback-item__meta">
            <span>${item.event_name || 'General feedback'}</span>
            <span>${this.formatDateTime(item.created_at)}</span>
          </div>
          <div class="feedback-item__message">${item.message}</div>
          <div class="feedback-item__footer">
            <span class="status-chip status-chip--${item.status}">${item.status.replace('_', ' ')}</span>
            ${item.rating ? `<span>${'★'.repeat(item.rating)}</span>` : ''}
            ${includeActions ? `<select data-feedback-id="${item.feedback_id}" class="form-control feedback-status-select"><option value="new" ${item.status === 'new' ? 'selected' : ''}>New</option><option value="in_review" ${item.status === 'in_review' ? 'selected' : ''}>In review</option><option value="resolved" ${item.status === 'resolved' ? 'selected' : ''}>Resolved</option></select>` : ''}
          </div>
        </div>
      `
      )
      .join('');

    if (includeActions) {
      container.querySelectorAll('.feedback-status-select').forEach((select) => {
        select.addEventListener('change', async () => {
          const id = select.getAttribute('data-feedback-id');
          await this.updateFeedbackStatus(id, select.value);
        });
      });
    }
  }

  async loadAdminPanel() {
    try {
      const [events, bookings, feedback, overview] = await Promise.all([
        this.api.getEvents({ includeInactive: true }),
        this.api.getBookings('all'),
        this.api.getFeedback('all'),
        this.api.getAdminOverview(),
      ]);
      this.eventsCache = events;
      this.bookingsCache = bookings;
      this.feedbackCache = feedback;
      this.renderAdminOverview(overview);
      this.renderAdminEvents(events);
      this.renderBookingReports(bookings);
      this.renderFeedbackTable(feedback);
    } catch (error) {
      this.showToast(error.message, 'error');
    }
  }

  renderAdminOverview(overview) {
    const container = document.getElementById('adminOverview');
    if (!container) return;
    const cards = [
      { label: 'Total Events', value: overview.totals.events, icon: '🎟️' },
      { label: 'Active Events', value: overview.totals.activeEvents, icon: '✅' },
      { label: 'Total Bookings', value: overview.totals.bookings, icon: '📈' },
      { label: 'Revenue', value: `PKR ${Number(overview.totals.revenue).toLocaleString()}`, icon: '💸' },
      { label: 'Open Feedback', value: overview.totals.feedbackOpen, icon: '💬' },
    ];
    container.innerHTML = cards
      .map(
        (card) => `
        <div class="analytics-card">
          <div class="analytics-card__icon">${card.icon}</div>
          <div class="analytics-card__content">
            <h4>${card.label}</h4>
            <p class="analytics-card__value">${card.value}</p>
          </div>
        </div>
      `
      )
      .join('');
  }

  renderAdminEvents(events) {
    const container = document.getElementById('adminEvents');
    if (!container) return;
    container.innerHTML = `
      <div class="admin-table-container">
        <table class="event-management-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Date</th>
              <th>Seats Left</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${events
              .map(
                (event) => `
                <tr>
                  <td>${event.event_name}</td>
                  <td>${event.event_type}</td>
                  <td>${this.formatDate(event.event_date)}</td>
                  <td>${event.available_seats}/${event.total_seats}</td>
                  <td>PKR ${Number(event.price_per_ticket).toLocaleString()}</td>
                  <td><span class="status status--${event.status === 'active' ? 'success' : 'warning'}">${event.status}</span></td>
                  <td>
                    <div class="event-actions">
                      <button class="btn btn--outline btn--sm" onclick="window.app.editEvent(${event.event_id})">Edit</button>
                      <button class="btn btn--outline btn--sm btn--danger" onclick="window.app.deleteEvent(${event.event_id})">Delete</button>
                    </div>
                  </td>
                </tr>
              `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  renderBookingReports(bookings) {
    const container = document.getElementById('bookingReports');
    if (!container) return;
    if (!bookings.length) {
      container.innerHTML = '<p class="loading">No bookings found.</p>';
      return;
    }
    container.innerHTML = `
      <div class="admin-table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Event</th>
              <th>Tickets</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${bookings
              .map(
                (booking) => {
                  // Show 'refunded' if payment_status is 'refunded', otherwise show booking_status
                  const displayStatus = booking.payment_status === 'refunded' ? 'refunded' : booking.booking_status;
                  const canCancel = booking.booking_status === 'confirmed';
                  return `
                <tr>
                  <td>#${booking.booking_id}</td>
                  <td>${booking.user_name}</td>
                  <td>${booking.event_name}</td>
                  <td>${booking.num_tickets}</td>
                  <td>PKR ${Number(booking.total_amount).toLocaleString()}</td>
                  <td><span class="status status--${canCancel ? 'success' : 'warning'}">${displayStatus}</span></td>
                  <td>${
                    canCancel
                      ? `<button class="btn btn--outline btn--sm btn--danger" onclick="window.app.cancelBooking(${booking.booking_id})">Cancel</button>`
                      : ''
                  }</td>
                </tr>
              `;
                }
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  renderFeedbackTable(feedback) {
    const container = document.getElementById('feedbackTable');
    const badge = document.getElementById('feedbackStatusCount');
    if (!container) return;
    if (!feedback.length) {
      container.innerHTML = '<p class="loading">No feedback submitted yet.</p>';
      badge.textContent = '0 open';
      return;
    }
    const openCount = feedback.filter((item) => item.status !== 'resolved').length;
    badge.textContent = `${openCount} open`;
    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Submitted</th>
            <th>Customer</th>
            <th>Event</th>
            <th>Message</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${feedback
            .map(
              (item) => `
              <tr>
                <td>${this.formatDateTime(item.created_at)}</td>
                <td>${item.full_name}<br><small>${item.email}</small></td>
                <td>${item.event_name || 'Platform'}</td>
                <td>${item.message}</td>
                <td>
                  <select data-feedback-id="${item.feedback_id}" class="form-control feedback-status-select">
                    <option value="new" ${item.status === 'new' ? 'selected' : ''}>New</option>
                    <option value="in_review" ${item.status === 'in_review' ? 'selected' : ''}>In review</option>
                    <option value="resolved" ${item.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                  </select>
                </td>
              </tr>
            `
            )
            .join('')}
        </tbody>
      </table>
    `;

    container.querySelectorAll('.feedback-status-select').forEach((select) => {
      select.addEventListener('change', async () => {
        const id = select.getAttribute('data-feedback-id');
        await this.updateFeedbackStatus(id, select.value);
      });
    });
  }

  async updateFeedbackStatus(id, status) {
    try {
      await this.api.updateFeedbackStatus(id, status);
      this.showToast('Feedback updated.', 'success');
    } catch (error) {
      this.showToast(error.message, 'error');
    }
  }

  async handleEventForm() {
    const payload = {
      event_name: document.getElementById('eventName').value,
      event_type: document.getElementById('eventType').value,
      venue: document.getElementById('eventVenue').value,
      event_date: document.getElementById('eventDate').value,
      event_time: document.getElementById('eventTime').value,
      price_per_ticket: Number(document.getElementById('eventPrice').value),
      total_seats: Number(document.getElementById('totalSeats').value),
      status: document.getElementById('eventStatus').value,
      banner_url: document.getElementById('eventImage').value,
      description: document.getElementById('eventDescription').value,
    };

    try {
      if (this.currentEditingEventId) {
        await this.api.updateEvent(this.currentEditingEventId, payload);
        this.showToast('Event updated.', 'success');
      } else {
        await this.api.createEvent(payload);
        this.showToast('Event created.', 'success');
      }
      this.hideModals();
      await this.loadAdminPanel();
    } catch (error) {
      this.showToast(error.message, 'error');
    }
  }

  async editEvent(eventId) {
    this.currentEditingEventId = eventId;
    const event = this.eventsCache.find((item) => item.event_id === eventId);
    if (!event) return;
    document.getElementById('eventModalTitle').textContent = 'Edit Event';
    document.getElementById('eventName').value = event.event_name;
    document.getElementById('eventType').value = event.event_type;
    document.getElementById('eventVenue').value = event.venue;
    document.getElementById('eventDate').value = event.event_date;
    document.getElementById('eventTime').value = event.event_time;
    document.getElementById('eventPrice').value = event.price_per_ticket;
    document.getElementById('totalSeats').value = event.total_seats;
    document.getElementById('eventStatus').value = event.status;
    document.getElementById('eventImage').value = event.banner_url || '';
    document.getElementById('eventDescription').value = event.description || '';
    document.getElementById('eventModal').classList.remove('hidden');
  }

  showEventModal() {
    this.currentEditingEventId = null;
    document.getElementById('eventModalTitle').textContent = 'Add New Event';
    document.getElementById('eventForm').reset();
    document.getElementById('eventModal').classList.remove('hidden');
  }

  deleteEvent(eventId) {
    this.eventToDelete = eventId;
    document.getElementById('deleteModal').classList.remove('hidden');
  }

  async confirmDeleteEvent() {
    if (!this.eventToDelete) return;
    try {
      await this.api.deleteEvent(this.eventToDelete);
      this.showToast('Event deleted.', 'success');
      this.eventToDelete = null;
      this.hideModals();
      await this.loadAdminPanel();
    } catch (error) {
      this.showToast(error.message, 'error');
    }
  }

  cancelBooking(bookingId) {
    this.bookingToCancel = bookingId;
    document.getElementById('cancelBookingModal').classList.remove('hidden');
  }

  async confirmCancelBooking() {
    if (!this.bookingToCancel) return;
    try {
      await this.api.cancelBooking(this.bookingToCancel);
      this.showToast('Booking cancelled.', 'success');
      this.bookingToCancel = null;
      this.hideModals();
      if (this.currentPage === 'admin') {
        await this.loadAdminPanel();
      } else {
        await this.loadDashboard();
      }
    } catch (error) {
      this.showToast(error.message, 'error');
    }
  }

  logout() {
    this.state.logout();
    this.updateUI();
    this.navigateToPage('home');
    this.showToast('Logged out.', 'info');
  }

  showLoginModal() {
    document.getElementById('loginModal')?.classList.remove('hidden');
  }

  showRegisterModal() {
    document.getElementById('registerModal')?.classList.remove('hidden');
  }

  hideModals() {
    document.querySelectorAll('.modal').forEach((modal) => modal.classList.add('hidden'));
    this.currentEditingEventId = null;
    this.eventToDelete = null;
    this.bookingToCancel = null;
  }

  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const messageEl = toast?.querySelector('.toast__message');
    if (!toast || !messageEl) return;
    messageEl.textContent = message;
    toast.className = `toast toast--${type} show`;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.classList.add('hidden'), 300);
    }, 3000);
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}

function navigateToPage(page) {
  window.app?.navigateToPage(page);
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new TicketBookerApp();
});
