const { errorResponse } = require('src/utils/response');
const { authenticate, requireAdmin, validateRequest } = require('src/lib/api-helpers');
const logger = require('src/utils/logger');
const eventService = require('src/services/event.service');
const { updateEventSchema } = require('src/validators/event.validator');

async function handler(req, res) {
  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      const event = await eventService.getEventById(id);
      return res.status(200).json(event);
    }

    if (req.method === 'PUT') {
      const user = await authenticate(req);
      requireAdmin(user);
      const validatedData = validateRequest(updateEventSchema, 'body')(req);
      const event = await eventService.updateEvent(id, validatedData);
      return res.status(200).json(event);
    }

    if (req.method === 'DELETE') {
      const user = await authenticate(req);
      requireAdmin(user);
      await eventService.softDeleteEvent(id);
      return res.status(200).json({ message: 'Event deleted' });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    logger.error(error);
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error, statusCode);
  }
}
module.exports = handler;
module.exports.default = handler;
