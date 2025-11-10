const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middleware/auth');
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', requireAuth, authController.profile);
router.post('/logout', requireAuth, authController.logout);
router.delete('/users/:id', requireAuth, requirePermission('users', 'delete'), authController.deleteUser);

module.exports = router;
