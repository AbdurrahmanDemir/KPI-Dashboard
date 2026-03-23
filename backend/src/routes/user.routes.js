const express = require('express');
const router = express.Router();
const { getUsers, createUser, changeRole, changePassword } = require('../controllers/user.controller');
const { authenticate, requireAdmin } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Kullanıcı ve Profil Yönetimi (Admin Only & Self)
 */

router.get('/', authenticate, requireAdmin, getUsers);
router.post('/', authenticate, requireAdmin, createUser);
router.put('/:id/role', authenticate, requireAdmin, changeRole);
router.put('/me/password', authenticate, changePassword);

module.exports = router;
