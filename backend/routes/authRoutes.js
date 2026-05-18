const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logoutUser);
router.get('/me', authMiddleware, authController.getCurrentUser);
router.put('/me', authMiddleware, authController.updateCurrentUser);
router.get('/settings', authMiddleware, authController.getSettings);
router.put('/settings', authMiddleware, authController.updateSettings);

module.exports = router;
