const { Router } = require('express');
const feedbackController = require('../controllers/feedback.controller');
const authenticate = require('../middleware/auth.middleware');
const requireAdmin = require('../middleware/admin.middleware');
const validate = require('../middleware/validation.middleware');
const {
  createFeedbackSchema,
  updateFeedbackStatusSchema,
} = require('../validators/feedback.validator');

const router = Router();

router.use(authenticate);
router.post('/', validate(createFeedbackSchema), feedbackController.createFeedback);
router.get('/', feedbackController.listFeedback);
router.patch('/:id', requireAdmin, validate(updateFeedbackStatusSchema), feedbackController.updateFeedbackStatus);

module.exports = router;


