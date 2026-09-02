const Theatre = require("../models/theatre");
const Show = require("../models/show");
const Movie = require("../models/movie");

// GET /theatres - Theatres listing with city filter and Leaflet map data
module.exports.index = async (req, res, next) => {
  try {
    const { city = "Mumbai" } = req.query;

    const filter = {};
    if (city && city !== "All") filter.city = city;

    const theatres = await Theatre.find(filter);
    const cities = ["Mumbai", "Delhi-NCR", "Bengaluru", "Hyderabad", "Pune", "Chennai", "Kolkata"];

    return res.render("theatres/index", {
      theatres,
      cities,
      selectedCity: city,
    });
  } catch (err) {
    return next(err);
  }
};

// GET /theatres/:id - Theatre detail with currently playing shows
module.exports.showTheatre = async (req, res, next) => {
  try {
    const { id } = req.params;
    const theatre = await Theatre.findById(id);

    if (!theatre) {
      req.flash("error", "Cinema hall not found!");
      return res.redirect("/theatres");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find shows at this theatre
    const shows = await Show.find({
      theatre: id,
      showDate: { $gte: today },
    }).populate("movie");

    // Group shows by Movie
    const moviesMap = new Map();
    shows.forEach((s) => {
      if (s.movie) {
        const mId = s.movie._id.toString();
        if (!moviesMap.has(mId)) {
          moviesMap.set(mId, { movie: s.movie, showtimes: [] });
        }
        moviesMap.get(mId).showtimes.push(s);
      }
    });

    const currentPlaying = Array.from(moviesMap.values());

    return res.render("theatres/show", {
      theatre,
      currentPlaying,
    });
  } catch (err) {
    return next(err);
  }
};
