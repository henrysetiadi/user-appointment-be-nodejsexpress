const express = require('express');
const router = express.Router();

const authenticateToken = require('../middleware/authMiddleware');
const { getUserProfile, getUsers, getUsersWithPagination } = require('../controllers/userController'); // ✅ Ensure this import is correct

// Route to get the logged-in user's profile
router.get("/me", authenticateToken, getUserProfile);

// Route to get users, excluding the logged-in user
router.get('/users', authenticateToken, getUsers); // Route to get users, excluding the logged-in user

// Route to get users, excluding the logged-in user
router.get('/listUsers', authenticateToken, getUsersWithPagination); // Route to pagination of user

module.exports = router;
