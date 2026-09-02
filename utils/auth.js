const Movie = require("../models/movie");
const Review = require("../models/review");

// Ensure User is Logged In
module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    if (req.method === "GET") {
      req.session.redirectUrl = req.originalUrl;
    }
    req.flash("error", "Please sign in to proceed!");
    return res.redirect("/login");
  }
  return next();
};

// Save Redirect URL from session or query parameter
module.exports.saveRedirect = (req, res, next) => {
  if (req.query.redirect) {
    req.session.redirectUrl = req.query.redirect;
  }
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
    delete req.session.redirectUrl;
  }
  return next();
};

// Ensure User has Admin privileges
module.exports.isAdmin = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "You must be signed in!");
    return res.redirect("/login");
  }
  if (req.user.role !== "admin") {
    req.flash("error", "Access denied: Admin privileges required!");
    return res.redirect("/movies");
  }
  return next();
};

// Check Review Author
module.exports.isReviewAuthor = async (req, res, next) => {
  try {
    const { reviewId, id } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) {
      req.flash("error", "Review not found!");
      return res.redirect(`/movies/${id}`);
    }
    if (!req.user || (!review.author.equals(req.user._id) && req.user.role !== "admin")) {
      req.flash("error", "You do not have permission to delete this review!");
      return res.redirect(`/movies/${id}`);
    }
    return next();
  } catch (err) {
    return next(err);
  }
};

// Validation for Movies
module.exports.validateMovie = (req, res, next) => {
  const { movie } = req.body;
  if (!movie) {
    req.flash("error", "Movie data is required!");
    return res.redirect("/movies");
  }
  if (!movie.title || movie.title.trim().length < 2) {
    req.flash("error", "Movie title must have at least 2 characters!");
    return res.redirect(req.method === "POST" ? "/movies/new" : `/movies/${req.params.id}/edit`);
  }
  if (!movie.duration || isNaN(Number(movie.duration))) {
    req.flash("error", "Valid duration in minutes is required!");
    return res.redirect(req.method === "POST" ? "/movies/new" : `/movies/${req.params.id}/edit`);
  }
  return next();
};

// Validation for Reviews
module.exports.validateReview = (req, res, next) => {
  const { review } = req.body;
  if (!review || !review.comment || review.comment.trim().length === 0) {
    req.flash("error", "Review message cannot be empty!");
    return res.redirect(`/movies/${req.params.id}`);
  }
  const rating = Number(review.rating);
  if (!rating || rating < 1 || rating > 10) {
    req.flash("error", "Please provide a rating between 1 and 10!");
    return res.redirect(`/movies/${req.params.id}`);
  }
  return next();
};
