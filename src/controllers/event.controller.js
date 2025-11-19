const eventService = require('../services/event.service');

const listEvents = async (req, res, next) => {
  try {
    const events = await eventService.listEvents({
      includeInactive: req.query.includeInactive === 'true',
      status: req.query.status || 'active',
    });
    return res.json(events);
  } catch (error) {
    return next(error);
  }
};

const getEvent = async (req, res, next) => {
  try {
    const event = await eventService.getEventById(req.params.id);
    return res.json(event);
  } catch (error) {
    return next(error);
  }
};

const createEvent = async (req, res, next) => {
  try {
    const event = await eventService.createEvent(req.body, req.user.user_id);
    return res.status(201).json(event);
  } catch (error) {
    return next(error);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const event = await eventService.updateEvent(req.params.id, req.body);
    return res.json(event);
  } catch (error) {
    return next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    await eventService.softDeleteEvent(req.params.id);
    return res.json({ message: 'Event deleted' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
};


