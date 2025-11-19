const { Router } = require('express');
const bookingController = require('../controllers/booking.controller');
const authenticate = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');
const { createBookingSchema, seatLockSchema } = require('../validators/booking.validator');

const router = Router();

router.use(authenticate);
router.get('/', bookingController.listBookings);
router.post('/', validate(createBookingSchema), bookingController.createBooking);
router.post('/lock', validate(seatLockSchema), bookingController.createSeatLock);
router.delete('/lock/:lockId', bookingController.releaseSeatLock);
router.patch('/:id/cancel', bookingController.cancelBooking);

module.exports = router;


