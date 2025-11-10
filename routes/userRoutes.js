const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middleware/auth');
const userController = require('../controllers/userController');

router.get('/', requireAuth, requirePermission('users', 'read'), userController.listUsers);
router.put('/:id', requireAuth, requirePermission('users', 'write'), userController.updateUser);
router.delete('/:id', requireAuth, requirePermission('users', 'delete'), userController.deleteUser);
router.get('/:id/permissions', requireAuth, userController.getPermissions);


module.exports = router;