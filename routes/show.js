const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn } = require("../utils/auth");
const showController = require("../controllers/show");

// Select showtimes for a movie
router.get("/movie/:movieId", wrapAsync(showController.selectShowtimes));

// Interactive Seat matrix layout for a specific show
router.get("/:id/seats", isLoggedIn, wrapAsync(showController.renderSeatLayout));

module.exports = router;
