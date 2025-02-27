const express = require('express');
const { body } = require("express-validator");
const router = express.Router();

const authenticateToken = require('../middleware/authMiddleware');
const { createAppointment, getAppointments, getAvailableUsers, getAppointmentById, updateAppointment, deleteAppointment } = require("../controllers/appointmentController");

// Protect routes (require authentication)
router.post("/create", authenticateToken,
    [
        body("title").notEmpty().withMessage("Title is required."),
        body("start").isISO8601().withMessage("Start time must be a valid ISO date."),
        body("end").isISO8601().withMessage("End time must be a valid ISO date."),
        body("invitedUserIds").isArray().withMessage("Invited users must be an array."),
    ], 
    createAppointment);

// Update an existing appointment (for modifying the invited users)
router.put("/update/:id", authenticateToken,
    [
        body("title").optional().notEmpty().withMessage("Title is required."),
        body("start").optional().isISO8601().withMessage("Start time must be a valid ISO date."),
        body("end").optional().isISO8601().withMessage("End time must be a valid ISO date."),
        body("invitedUserIds").optional().isArray().withMessage("Invited users must be an array."),
    ],
    updateAppointment);

router.delete("/delete/:id", authenticateToken, deleteAppointment);

router.get("/", authenticateToken, getAppointments);

router.get("/appointmentById/:id", authenticateToken, getAppointmentById);

router.get('/available-users', authenticateToken, getAvailableUsers);

module.exports = router;
