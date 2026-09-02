const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn, isAdmin, validateMovie } = require("../utils/auth");
const movieController = require("../controllers/movie");

const multer = require("multer");
const { storage } = require("../cloudConfig");
const upload = multer({ storage });

// Autocomplete suggestion API
router.get("/suggest", wrapAsync(movieController.suggest));

// Search movies
router.get("/search", wrapAsync(movieController.search));

// Add new movie (Admin)
router.get("/new", isLoggedIn, isAdmin, movieController.renderNewForm);

// Index & Create
router
  .route("/")
  .get(wrapAsync(movieController.index))
  .post(
    isLoggedIn,
    isAdmin,
    upload.fields([
      { name: "poster", maxCount: 1 },
      { name: "backdrop", maxCount: 1 },
    ]),
    validateMovie,
    wrapAsync(movieController.createMovie)
  );

// Edit movie (Admin)
router.get("/:id/edit", isLoggedIn, isAdmin, wrapAsync(movieController.renderEditForm));

// Show, Update, Delete
router
  .route("/:id")
  .get(wrapAsync(movieController.showMovie))
  .put(
    isLoggedIn,
    isAdmin,
    upload.fields([
      { name: "poster", maxCount: 1 },
      { name: "backdrop", maxCount: 1 },
    ]),
    validateMovie,
    wrapAsync(movieController.updateMovie)
  )
  .delete(isLoggedIn, isAdmin, wrapAsync(movieController.deleteMovie));

module.exports = router;
