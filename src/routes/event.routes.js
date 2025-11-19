const { Router } = require('express');
const eventController = require('../controllers/event.controller');
const authenticate = require('../middleware/auth.middleware');
const requireAdmin = require('../middleware/admin.middleware');
const validate = require('../middleware/validation.middleware');
const { createEventSchema, updateEventSchema } = require('../validators/event.validator');

const router = Router();

router.get('/', eventController.listEvents);
router.get('/:id', eventController.getEvent);
router.post('/', authenticate, requireAdmin, validate(createEventSchema), eventController.createEvent);
router.put('/:id', authenticate, requireAdmin, validate(updateEventSchema), eventController.updateEvent);
router.delete('/:id', authenticate, requireAdmin, eventController.deleteEvent);

module.exports = router;


