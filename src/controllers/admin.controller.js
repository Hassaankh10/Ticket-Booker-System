const adminService = require('../services/admin.service');

const createUser = async (req, res, next) => {
  try {
    const user = await adminService.createUser(req.body);
    return res.status(201).json(user);
  } catch (error) {
    return next(error);
  }
};

const overview = async (req, res, next) => {
  try {
    const data = await adminService.getOverview();
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

const revenueReport = async (req, res, next) => {
  try {
    const data = await adminService.getRevenueReport();
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

const popularEvents = async (req, res, next) => {
  try {
    const data = await adminService.getPopularEvents();
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

const userStats = async (req, res, next) => {
  try {
    const data = await adminService.getUserStats();
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

const softDeleteEvent = async (req, res, next) => {
  try {
    await adminService.softDeleteEvent(req.params.id);
    return res.json({ message: 'Event soft deleted' });
  } catch (error) {
    return next(error);
  }
};

const updateEventStatus = async (req, res, next) => {
  try {
    const event = await adminService.updateEventStatus(req.params.id, req.body.status);
    return res.json(event);
  } catch (error) {
    return next(error);
  }
};

const mostPopularEvent = async (req, res, next) => {
  try {
    const events = await adminService.getPopularEvents();
    return res.json(events[0] || null);
  } catch (error) {
    return next(error);
  }
};

const eventsStatus = async (req, res, next) => {
  try {
    const data = await adminService.getEventsStatus();
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createUser,
  overview,
  revenueReport,
  popularEvents,
  userStats,
  softDeleteEvent,
  updateEventStatus,
  mostPopularEvent,
  eventsStatus,
};


