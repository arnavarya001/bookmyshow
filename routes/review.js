const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn, isReviewAuthor, validateReview } = require("../utils/auth");
const reviewController = require("../controllers/review");

// Add Review
router.post("/", isLoggedIn, validateReview, wrapAsync(reviewController.addReview));

// Delete Review
router.delete("/:reviewId", isLoggedIn, isReviewAuthor, wrapAsync(reviewController.deleteReview));

module.exports = router;
