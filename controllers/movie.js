const mongoose = require("mongoose");
const Movie = require("../models/movie");
const User = require("../models/user");
const Show = require("../models/show");
const Theatre = require("../models/theatre");

// GET /movies - Movie catalog with filter & sort
module.exports.index = async (req, res, next) => {
  try {
    const { genre, language, format, sort, city = "Mumbai" } = req.query;

    const filter = {};
    if (genre && genre !== "All") filter.genre = genre;
    if (language && language !== "All") filter.language = language;
    if (format && format !== "All") filter.format = format;

    let sortQuery = { releaseDate: -1 };
    if (sort === "rating") sortQuery = { rating: -1 };
    if (sort === "popularity") sortQuery = { votesCount: -1 };

    let movies = [];
    let trendingMovies = [];
    let allGenres = ["Action", "Sci-Fi", "Adventure", "Drama", "Animation"];
    let allLanguages = ["English", "Hindi", "Tamil", "Telugu"];

    if (mongoose.connection.readyState === 1) {
      try {
        movies = await Movie.find(filter).sort(sortQuery);
        trendingMovies = await Movie.find({ isTrending: true }).limit(5);
        allGenres = await Movie.distinct("genre");
        allLanguages = await Movie.distinct("language");
      } catch (dbErr) {
        console.warn("Database query notice:", dbErr.message);
      }
    }

    if (!movies || movies.length === 0) {
      const { sampleMovies } = require("../init/data");
      movies = sampleMovies.map((m, idx) => ({ ...m, _id: "preview_" + (idx + 1) }));
      trendingMovies = movies.filter((m) => m.isTrending);
    }

    // Check user watchlist
    let watchlistIds = [];
    if (req.user) {
      try {
        const user = await User.findById(req.user._id);
        if (user && user.watchlist) {
          watchlistIds = user.watchlist.map((id) => id.toString());
        }
      } catch (e) {}
    }

    return res.render("movies/index", {
      movies,
      trendingMovies,
      allGenres,
      allLanguages,
      selectedGenre: genre || "All",
      selectedLanguage: language || "All",
      selectedCity: city,
      watchlistIds,
    });
  } catch (err) {
    return next(err);
  }
};

// GET /movies/:id - Movie Details
module.exports.showMovie = async (req, res, next) => {
  try {
    const { id } = req.params;
    const movie = await Movie.findById(id)
      .populate({
        path: "reviews",
        populate: { path: "author", select: "username avatar" },
      })
      .populate("owner");

    if (!movie) {
      req.flash("error", "Movie not found!");
      return res.redirect("/movies");
    }

    // Check if in user watchlist
    let isInWatchlist = false;
    if (req.user) {
      const user = await User.findById(req.user._id);
      isInWatchlist = user?.watchlist?.some((wId) => wId.toString() === id);
    }

    // Find available upcoming show dates for this movie
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingShows = await Show.find({
      movie: id,
      showDate: { $gte: today },
    }).populate("theatre");

    // Distinct theatres showing this movie
    const theatreMap = new Map();
    upcomingShows.forEach((s) => {
      if (s.theatre) {
        theatreMap.set(s.theatre._id.toString(), s.theatre);
      }
    });
    const theatres = Array.from(theatreMap.values());

    return res.render("movies/show", {
      movie,
      theatres,
      isInWatchlist,
      upcomingShowsCount: upcomingShows.length,
    });
  } catch (err) {
    return next(err);
  }
};

// GET /movies/new - Add Movie Form (Admin)
module.exports.renderNewForm = (req, res) => {
  return res.render("movies/new");
};

// POST /movies - Create Movie
module.exports.createMovie = async (req, res, next) => {
  try {
    const { movie } = req.body;
    const newMovie = new Movie({
      ...movie,
      genre: typeof movie.genre === "string" ? movie.genre.split(",").map((g) => g.trim()) : movie.genre,
      language: typeof movie.language === "string" ? movie.language.split(",").map((l) => l.trim()) : movie.language,
      format: typeof movie.format === "string" ? movie.format.split(",").map((f) => f.trim()) : movie.format,
      owner: req.user._id,
    });

    // Poster Image
    if (req.files && req.files.poster) {
      newMovie.poster = {
        url: req.files.poster[0].path,
        filename: req.files.poster[0].filename,
      };
    } else if (movie.posterUrl) {
      newMovie.poster = { url: movie.posterUrl, filename: "external" };
    }

    // Backdrop Image
    if (req.files && req.files.backdrop) {
      newMovie.backdrop = {
        url: req.files.backdrop[0].path,
        filename: req.files.backdrop[0].filename,
      };
    } else if (movie.backdropUrl) {
      newMovie.backdrop = { url: movie.backdropUrl, filename: "external" };
    }

    await newMovie.save();
    req.flash("success", `Movie "${newMovie.title}" added successfully!`);
    return res.redirect(`/movies/${newMovie._id}`);
  } catch (err) {
    return next(err);
  }
};

// GET /movies/:id/edit - Edit Form
module.exports.renderEditForm = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      req.flash("error", "Movie not found!");
      return res.redirect("/movies");
    }
    return res.render("movies/edit", { movie });
  } catch (err) {
    return next(err);
  }
};

// PUT /movies/:id - Update Movie
module.exports.updateMovie = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { movie } = req.body;

    const formattedMovie = {
      ...movie,
      genre: typeof movie.genre === "string" ? movie.genre.split(",").map((g) => g.trim()) : movie.genre,
      language: typeof movie.language === "string" ? movie.language.split(",").map((l) => l.trim()) : movie.language,
      format: typeof movie.format === "string" ? movie.format.split(",").map((f) => f.trim()) : movie.format,
    };

    const updated = await Movie.findByIdAndUpdate(id, formattedMovie, { new: true });

    if (req.files && req.files.poster) {
      updated.poster = {
        url: req.files.poster[0].path,
        filename: req.files.poster[0].filename,
      };
    }
    if (req.files && req.files.backdrop) {
      updated.backdrop = {
        url: req.files.backdrop[0].path,
        filename: req.files.backdrop[0].filename,
      };
    }

    await updated.save();
    req.flash("success", "Movie details updated successfully!");
    return res.redirect(`/movies/${id}`);
  } catch (err) {
    return next(err);
  }
};

// DELETE /movies/:id - Delete Movie
module.exports.deleteMovie = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Movie.findByIdAndDelete(id);
    await Show.deleteMany({ movie: id });
    req.flash("success", "Movie and associated shows deleted!");
    return res.redirect("/movies");
  } catch (err) {
    return next(err);
  }
};

// GET /movies/suggest - Autocomplete API
module.exports.suggest = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json([]);

    const movies = await Movie.find({
      $or: [
        { title: { $regex: q, $options: "i" } },
        { genre: { $regex: q, $options: "i" } },
        { language: { $regex: q, $options: "i" } },
      ],
    }).limit(6);

    const suggestions = movies.map((m) => ({
      id: m._id,
      title: m.title,
      poster: m.poster.url,
      rating: m.rating,
      languages: m.language.join(", "),
      genres: m.genre.join(" • "),
    }));

    return res.json(suggestions);
  } catch (err) {
    return res.json([]);
  }
};

// GET /movies/search - Search Results Page
module.exports.search = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === "") {
      req.flash("error", "Please enter a search term!");
      return res.redirect("/movies");
    }

    const movies = await Movie.find({
      $or: [
        { title: { $regex: q, $options: "i" } },
        { genre: { $regex: q, $options: "i" } },
        { language: { $regex: q, $options: "i" } },
        { "cast.name": { $regex: q, $options: "i" } },
      ],
    });

    const related = await Movie.aggregate([{ $sample: { size: 4 } }]);

    return res.render("movies/search", { movies, related, q });
  } catch (err) {
    return next(err);
  }
};
