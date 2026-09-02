const User = require("../models/user");
const Movie = require("../models/movie");

// Render Signup Form
module.exports.renderSignupForm = (req, res) => {
  return res.render("users/signup");
};

// Process Signup
module.exports.signup = async (req, res, next) => {
  try {
    const { username, email, phone, password, role } = req.body;

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      req.flash("error", "An account with this email already exists!");
      return res.redirect("/signup");
    }

    const newUser = new User({
      username,
      email,
      phone,
      role: role === "admin" ? "admin" : "user",
    });

    const registeredUser = await User.register(newUser, password);

    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash("success", `Welcome to BookMyShow, ${registeredUser.username}! 🎉`);
      return res.redirect("/movies");
    });
  } catch (err) {
    req.flash("error", err.message);
    return res.redirect("/signup");
  }
};

// Render Login Form
module.exports.renderLoginForm = (req, res) => {
  return res.render("users/login");
};

// Process Login
module.exports.login = (req, res) => {
  req.flash("success", `Welcome back, ${req.user.username}!`);
  const redirectUrl = res.locals.redirectUrl || "/movies";
  return res.redirect(redirectUrl);
};

// Process Logout
module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "You have been logged out successfully!");
    return res.redirect("/movies");
  });
};

// Toggle Movie Watchlist (AJAX or form)
module.exports.toggleWatchlist = async (req, res) => {
  try {
    const { movieId } = req.params;
    const user = await User.findById(req.user._id);

    const index = user.watchlist.findIndex((id) => id.toString() === movieId);
    let status = "added";

    if (index > -1) {
      user.watchlist.splice(index, 1);
      status = "removed";
    } else {
      user.watchlist.push(movieId);
      status = "added";
    }

    await user.save();
    return res.json({ status, count: user.watchlist.length });
  } catch (err) {
    return res.status(500).json({ error: "Could not update watchlist" });
  }
};

// View Watchlist
module.exports.getWatchlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("watchlist");
    return res.render("watchlist/index", { watchlist: user.watchlist || [] });
  } catch (err) {
    return next(err);
  }
};
