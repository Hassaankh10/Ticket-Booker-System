const { errorResponse } = require('../../../src/utils/response');
const { authenticate, requireAdmin, validateRequest } = require('../../../src/lib/api-helpers');
const logger = require('../../../src/utils/logger');
const feedbackService = require('../../../src/services/feedback.service');
const { createFeedbackSchema } = require('../../../src/validators/feedback.validator');

async function handler(req, res) {
  try {
    const user = await authenticate(req);

    if (req.method === 'POST') {
      const validatedData = validateRequest(createFeedbackSchema, 'body')(req);
      const feedback = await feedbackService.createFeedback({
        userId: user.user_id,
        ...validatedData,
      });
      return res.status(201).json(feedback);
    }

    if (req.method === 'GET') {
      const feedback = await feedbackService.listFeedback({
        scope: req.query.scope || (user.role === 'admin' ? 'all' : 'mine'),
        user,
      });
      return res.status(200).json(feedback);
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
