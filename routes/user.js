const express = require("express");
const router = express.Router();
const passport = require("passport");
const wrapAsync = require("../utils/wrapAsync");
const { saveRedirect, isLoggedIn } = require("../utils/auth");
const userController = require("../controllers/user");

const mongoose = require("mongoose");

const checkDB = (req, res, next) => {
  if (mongoose.connection.readyState < 1) {
    req.flash(
      "error",
      "Database is unreachable. In MongoDB Atlas, go to Network Access and add IP 0.0.0.0/0 (Allow access from anywhere), and verify your ATLASDB_URL."
    );
    return res.redirect(req.path === "/signup" ? "/signup" : "/login");
  }
  next();
};

// Signup
router
  .route("/signup")
  .get(userController.renderSignupForm)
  .post(checkDB, wrapAsync(userController.signup));

// Login
router
  .route("/login")
  .get(userController.renderLoginForm)
  .post(
    saveRedirect,
    checkDB,
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
