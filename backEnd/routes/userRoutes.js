const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { updateUser, getUser, changePassword } = require('../controllers/userController')

// Rutas protegidas
router.put('/:id', protect, updateUser)
router.get('/:id', protect, getUser)
router.post('/:id/change-password', protect, changePassword)

module.exports = router

