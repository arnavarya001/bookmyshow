const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const theatreController = require("../controllers/theatre");

// Theatres list
router.get("/", wrapAsync(theatreController.index));

// Theatre detail & current playing shows
router.get("/:id", wrapAsync(theatreController.showTheatre));

module.exports = router;
