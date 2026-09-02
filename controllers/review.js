const Review = require("../models/review");
const Movie = require("../models/movie");

// POST /movies/:id/reviews - Add Review
module.exports.addReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const movie = await Movie.findById(id).populate("reviews");

    if (!movie) {
      req.flash("error", "Movie not found!");
      return res.redirect("/movies");
    }

    const { rating, comment } = req.body.review;
    const newReview = new Review({
      rating: Number(rating),
      comment,
      movie: id,
      author: req.user._id,
    });

    await newReview.save();
    movie.reviews.push(newReview._id);

    // Update average rating & vote count
    const totalVotes = movie.votesCount + 1;
    const currentSum = (movie.rating || 8) * movie.votesCount;
    const newAvg = (currentSum + Number(rating)) / totalVotes;

    movie.rating = Math.round(newAvg * 10) / 10;
    movie.votesCount = totalVotes;
    await movie.save();

    req.flash("success", "Your review and rating have been posted!");
    return res.redirect(`/movies/${id}`);
  } catch (err) {
    return next(err);
  }
};

// DELETE /movies/:id/reviews/:reviewId - Delete Review
module.exports.deleteReview = async (req, res, next) => {
  try {
    const { id, reviewId } = req.params;

    await Movie.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);

    req.flash("success", "Review deleted successfully!");
    return res.redirect(`/movies/${id}`);
  } catch (err) {
    return next(err);
  }
};
