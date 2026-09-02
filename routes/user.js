const express = require("express");
const router = express.Router();
const passport = require("passport");
const wrapAsync = require("../utils/wrapAsync");
const { saveRedirect, isLoggedIn } = require("../utils/auth");
const userController = require("../controllers/user");

// Signup
router
  .route("/signup")
  .get(userController.renderSignupForm)
  .post(wrapAsync(userController.signup));

// Login
router
  .route("/login")
  .get(userController.renderLoginForm)
  .post(
    saveRedirect,
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true,
    }),
    userController.login
  );

// Logout
router.get("/logout", userController.logout);

// Watchlist Toggle
router.post("/watchlist/toggle/:movieId", isLoggedIn, wrapAsync(userController.toggleWatchlist));

// Watchlist Page
router.get("/watchlist", isLoggedIn, wrapAsync(userController.getWatchlist));

module.exports = router;
