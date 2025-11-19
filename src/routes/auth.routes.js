const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validation.middleware');
const authenticate = require('../middleware/auth.middleware');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/profile', authenticate, authController.profile);

module.exports = router;


