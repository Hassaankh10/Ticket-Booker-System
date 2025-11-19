const { errorResponse } = require('src/utils/response');
const logger = require('src/utils/logger');
const eventService = require('src/services/event.service');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const events = await eventService.listEvents({
      includeInactive: req.query.includeInactive === 'true',
      status: req.query.status || 'active',
    });
    return res.status(200).json(events);
  } catch (error) {
    logger.error(error);
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error, statusCode);
  }
}

module.exports = handler;
module.exports.default = handler;

