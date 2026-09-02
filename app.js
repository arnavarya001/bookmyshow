require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");

const User = require("./models/user");
const ExpressError = require("./utils/ExpressError");

// Route Handlers
const movieRouter = require("./routes/movie");
const reviewRouter = require("./routes/review");
const theatreRouter = require("./routes/theatre");
const showRouter = require("./routes/show");
const bookingRouter = require("./routes/booking");
const userRouter = require("./routes/user");

const fs = require("fs");

// Database Connection with Serverless Caching
const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL;
const dbUrl = process.env.ATLASDB_URL || (!isProd ? "mongodb://127.0.0.1:27017/bookmyshow" : null);
let cachedConnection = null;

async function connectDB() {
  if (!dbUrl) return null;
  if (cachedConnection && mongoose.connection.readyState >= 1) {
    return cachedConnection;
  }
  try {
    cachedConnection = await mongoose.connect(dbUrl, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log("Connected to BookMyShow Database 🎬");
    return cachedConnection;
  } catch (err) {
    console.warn("MongoDB connection notice:", err.message);
  }
}
if (dbUrl) {
  connectDB();
}

// View Engine
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
let viewsPath = path.join(__dirname, "views");
if (!fs.existsSync(viewsPath)) {
  viewsPath = path.join(process.cwd(), "views");
}
app.set("views", viewsPath);

// Middleware
let publicPath = path.join(__dirname, "public");
if (!fs.existsSync(publicPath)) {
  publicPath = path.join(process.cwd(), "public");
}
app.use(express.static(publicPath));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));

// Session Store
const secret = process.env.SECRET || "bookmyshow_super_secret_session_key";
const sessionConfig = {
  secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
};

if (process.env.ATLASDB_URL) {
  try {
    const store = MongoStore.create({
      mongoUrl: process.env.ATLASDB_URL,
      touchAfter: 24 * 3600,
    });
    store.on("error", (err) => {
      console.log("SESSION STORE NOTICE:", err.message);
    });
    sessionConfig.store = store;
  } catch (e) {
    console.warn("Session store fallback to memory:", e.message);
  }
} else if (!isProd && dbUrl) {
  try {
    const store = MongoStore.create({
      mongoUrl: dbUrl,
      touchAfter: 24 * 3600,
    });
    store.on("error", (err) => {
      console.log("SESSION STORE NOTICE:", err.message);
    });
    sessionConfig.store = store;
  } catch (e) {}
}

app.use(session(sessionConfig));

// Ensure DB is connected for serverless requests if DB URL is provided
app.use(async (req, res, next) => {
  if (dbUrl && mongoose.connection.readyState < 1) {
    await connectDB();
  }
  next();
});

app.use(flash());

// Passport Authentication
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser((id, done) => {
  if (mongoose.connection.readyState < 1) {
    return done(null, null);
  }
  return User.deserializeUser()(id, done);
});

// Global Locals Middleware
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  res.locals.currentPath = req.originalUrl.split("?")[0];
  res.locals.selectedCity = req.session.currentCity || "Mumbai";
  next();
});

// Set City Preference
app.post("/api/set-city", (req, res) => {
  const { city } = req.body;
  if (city) {
    req.session.currentCity = city;
  }
  return res.json({ success: true, city });
});

// Root Route
app.get("/", (req, res) => {
  return res.redirect("/movies");
});

// Mount Routes
app.use("/movies/:id/reviews", reviewRouter);
app.use("/movies", movieRouter);
app.use("/theatres", theatreRouter);
app.use("/shows", showRouter);
app.use("/bookings", bookingRouter);
app.use("/", userRouter);

// 404 Route
app.all("{*path}", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

// Global Error Handler
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const { statusCode = 500, message = "Something went wrong!" } = err;
  try {
    return res.status(statusCode).render("error", { message });
  } catch (renderErr) {
    return res.status(statusCode).send(`
      <div style="font-family: sans-serif; padding: 40px; background: #0c0e12; color: #fff; min-height: 100vh;">
        <h1 style="color: #F84464;">Error ${statusCode}</h1>
        <p>${message}</p>
        <a href="/movies" style="color: #F84464;">Return to Home</a>
      </div>
    `);
  }
});

// Start Server
if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`🍿 BookMyShow Server running smoothly at http://localhost:${PORT}`);
  });
}

module.exports = app;