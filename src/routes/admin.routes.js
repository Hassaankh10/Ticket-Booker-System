const { Router } = require('express');
const adminController = require('../controllers/admin.controller');
const authenticate = require('../middleware/auth.middleware');
const requireAdmin = require('../middleware/admin.middleware');
const validate = require('../middleware/validation.middleware');
const { createUserSchema } = require('../validators/admin.validator');
const { statusSchema } = require('../validators/event.validator');

const router = Router();

router.use(authenticate, requireAdmin);

router.post('/users', validate(createUserSchema), adminController.createUser);
router.get('/overview', adminController.overview);
router.get('/revenue', adminController.revenueReport);
router.get('/popular-events', adminController.popularEvents);
router.get('/user-stats', adminController.userStats);
router.get('/events/status', adminController.eventsStatus);
router.get('/most-popular-event', adminController.mostPopularEvent);
router.patch('/events/:id/status', validate(statusSchema), adminController.updateEventStatus);
router.delete('/events/:id', adminController.softDeleteEvent);

module.exports = router;


