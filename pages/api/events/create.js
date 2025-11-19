const { errorResponse } = require('src/utils/response');
const { authenticate, requireAdmin, validateRequest } = require('src/lib/api-helpers');
const logger = require('src/utils/logger');
const eventService = require('src/services/event.service');
const { createEventSchema } = require('src/validators/event.validator');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const user = await authenticate(req);
    requireAdmin(user);
    const validatedData = validateRequest(createEventSchema, 'body')(req);
    const event = await eventService.createEvent(validatedData, user.user_id);
    return res.status(201).json(event);
  } catch (error) {
    logger.error(error);
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error, statusCode);
  }
}
module.exports = handler;
module.exports.default = handler;
