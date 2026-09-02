const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn } = require("../utils/auth");
const bookingController = require("../controllers/booking");

// Step 1: Submit chosen seats & snacks, render payment review page
router.post("/checkout", isLoggedIn, wrapAsync(bookingController.initiateBooking));

// Step 2: Confirm Payment & Issue Ticket
router.post("/verify-payment", isLoggedIn, wrapAsync(bookingController.verifyPayment));

// Step 3: View Digital Ticket
router.get("/ticket/:id", isLoggedIn, wrapAsync(bookingController.viewTicket));

// Booking History
router.get("/history", isLoggedIn, wrapAsync(bookingController.bookingHistory));

// Cancel Ticket
router.post("/:id/cancel", isLoggedIn, wrapAsync(bookingController.cancelBooking));

module.exports = router;
