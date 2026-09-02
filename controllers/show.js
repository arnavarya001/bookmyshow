const Show = require("../models/show");
const Movie = require("../models/movie");
const Theatre = require("../models/theatre");

// Helper to format date strings
function formatDateKey(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

// GET /shows/movie/:movieId - Showtimes page for a movie
module.exports.selectShowtimes = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const { city = "Mumbai", date } = req.query;

    const movie = await Movie.findById(movieId);
    if (!movie) {
      req.flash("error", "Movie not found!");
      return res.redirect("/movies");
    }

    // Build array of 5 selectable dates starting from today
    const dateTabs = [];
    const today = new Date();
    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      d.setHours(0, 0, 0, 0);
      const dayName = i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short" });
      const dateNum = d.getDate();
      const monthName = d.toLocaleDateString("en-US", { month: "short" });
      dateTabs.push({
        dateStr: d.toISOString().split("T")[0],
        dayName,
        dateNum,
        monthName,
        fullDate: d,
      });
    }

    // Selected date (defaults to today)
    const selectedDateStr = date || dateTabs[0].dateStr;
    const queryDateStart = new Date(selectedDateStr);
    queryDateStart.setHours(0, 0, 0, 0);

    const queryDateEnd = new Date(selectedDateStr);
    queryDateEnd.setHours(23, 59, 59, 999);

    // Fetch shows for this movie, date, and city
    const shows = await Show.find({
      movie: movieId,
      showDate: { $gte: queryDateStart, $lte: queryDateEnd },
    }).populate("theatre");

    // Filter by city if theatre has a city
    const filteredShows = shows.filter(
      (s) => !s.theatre || !s.theatre.city || s.theatre.city.toLowerCase() === city.toLowerCase()
    );

    // Group shows by Theatre
    const theatreScheduleMap = new Map();
    filteredShows.forEach((s) => {
      if (s.theatre) {
        const tId = s.theatre._id.toString();
        if (!theatreScheduleMap.has(tId)) {
          theatreScheduleMap.set(tId, {
            theatre: s.theatre,
            shows: [],
          });
        }
        theatreScheduleMap.get(tId).shows.push(s);
      }
    });

    const cinemaSchedules = Array.from(theatreScheduleMap.values());

    return res.render("shows/select-show", {
      movie,
      dateTabs,
      selectedDateStr,
      selectedCity: city,
      cinemaSchedules,
      cities: ["Mumbai", "Delhi-NCR", "Bengaluru", "Hyderabad", "Pune"],
    });
  } catch (err) {
    return next(err);
  }
};

// GET /shows/:id/seats - Interactive Seat Matrix
module.exports.renderSeatLayout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const show = await Show.findById(id).populate("movie").populate("theatre");

    if (!show) {
      req.flash("error", "Show not found!");
      return res.redirect("/movies");
    }

    // Define auditorium rows configuration
    // Rows: A (Recliner), B-E (Prime), F-H (Classic)
    const seatRows = [
      { rowLetter: "A", category: "Recliner", price: show.priceTiers.recliner || 600, totalSeats: 10 },
      { rowLetter: "B", category: "Prime", price: show.priceTiers.prime || 350, totalSeats: 12 },
      { rowLetter: "C", category: "Prime", price: show.priceTiers.prime || 350, totalSeats: 12 },
      { rowLetter: "D", category: "Prime", price: show.priceTiers.prime || 350, totalSeats: 12 },
      { rowLetter: "E", category: "Prime", price: show.priceTiers.prime || 350, totalSeats: 12 },
      { rowLetter: "F", category: "Classic", price: show.priceTiers.classic || 220, totalSeats: 12 },
      { rowLetter: "G", category: "Classic", price: show.priceTiers.classic || 220, totalSeats: 12 },
      { rowLetter: "H", category: "Classic", price: show.priceTiers.classic || 220, totalSeats: 12 },
    ];

    // Popular F&B snacks add-on list
    const snacksMenu = [
      { id: "popcorn_lg", name: "Caramel Popcorn (Jumbo)", price: 290, image: "🍿" },
      { id: "nachos", name: "Mexican Cheese Nachos", price: 240, image: "🧀" },
      { id: "pepsi_combo", name: "Popcorn & Pepsi Combo", price: 420, image: "🥤" },
      { id: "hotdog", name: "Gourmet Chicken Hot Dog", price: 260, image: "🌭" },
    ];

    return res.render("shows/seat-layout", {
      show,
      seatRows,
      bookedSeats: show.bookedSeats || [],
      snacksMenu,
    });
  } catch (err) {
    return next(err);
  }
};
