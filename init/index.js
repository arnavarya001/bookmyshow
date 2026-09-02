require("dotenv").config();
const mongoose = require("mongoose");
const { sampleMovies, sampleTheatres } = require("./data");

const Movie = require("../models/movie");
const Theatre = require("../models/theatre");
const Show = require("../models/show");
const Review = require("../models/review");
const Booking = require("../models/booking");
const User = require("../models/user");

const MONGO_URL = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/bookmyshow";

async function main() {
  await mongoose.connect(MONGO_URL);
  console.log("Connected to MongoDB for Database Seeding... 🚀");
}

const seedDatabase = async () => {
  try {
    await main();

    // 1. Clear existing data
    console.log("Clearing old collections...");
    await Movie.deleteMany({});
    await Theatre.deleteMany({});
    await Show.deleteMany({});
    await Review.deleteMany({});
    await Booking.deleteMany({});
    await User.deleteMany({});

    // 2. Create Admin and Regular Users
    console.log("Creating default users...");
    const adminUser = new User({
      username: "admin",
      email: "admin@bookmyshow.com",
      phone: "+91 99999 88888",
      role: "admin",
    });
    const registeredAdmin = await User.register(adminUser, "admin123");

    const demoUser = new User({
      username: "cinephile",
      email: "user@bookmyshow.com",
      phone: "+91 98765 43210",
      role: "user",
    });
    const registeredUser = await User.register(demoUser, "user123");

    // 3. Insert Theatres
    console.log("Seeding cinema halls...");
    const createdTheatres = await Theatre.insertMany(sampleTheatres);

    // 4. Insert Movies
    console.log("Seeding blockbuster movies...");
    const moviesWithOwners = sampleMovies.map((m) => ({
      ...m,
      owner: registeredAdmin._id,
    }));
    const createdMovies = await Movie.insertMany(moviesWithOwners);

    // 5. Generate Shows across 5 days for each movie & theatre
    console.log("Generating multi-screen show schedules...");
    const timeSlots = ["10:30 AM", "01:45 PM", "05:15 PM", "08:30 PM", "10:45 PM"];
    const formats = ["2D", "IMAX 3D", "4DX"];
    const screens = ["Audi 1 (Dolby)", "Audi 2 (IMAX)", "Audi 3 (Recliner Gold)", "Audi 4"];

    const showsToInsert = [];
    const today = new Date();

    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
      const showDate = new Date(today);
      showDate.setDate(today.getDate() + dayOffset);
      showDate.setHours(0, 0, 0, 0);

      createdMovies.forEach((movie) => {
        createdTheatres.forEach((theatre) => {
          // Add 2-3 shows per movie per theatre per day
          timeSlots.slice(0, 3).forEach((time, slotIdx) => {
            // Seed a few pre-booked seats to demonstrate matrix realistically
            const randomBookedSeats = ["A3", "A4", "D5", "D6", "E7", "F2"];

            showsToInsert.push({
              movie: movie._id,
              theatre: theatre._id,
              screen: screens[slotIdx % screens.length],
              showDate,
              showTime: time,
              format: movie.format[slotIdx % movie.format.length] || "2D",
              language: movie.language[0] || "English",
              priceTiers: {
                classic: 220,
                prime: 350,
                recliner: 600,
              },
              bookedSeats: randomBookedSeats,
              totalRows: 8,
              seatsPerRow: 12,
            });
          });
        });
      });
    }

    await Show.insertMany(showsToInsert);
    console.log(`Generated ${showsToInsert.length} cinema shows.`);

    // 6. Add Reviews for Movies
    console.log("Seeding verified reviews...");
    for (const movie of createdMovies) {
      const sampleReview = new Review({
        movie: movie._id,
        author: registeredUser._id,
        rating: Math.floor(Math.random() * 2) + 9, // 9 or 10
        comment: `Outstanding cinematic experience! The visuals, direction and sound design in "${movie.title}" were breathtaking. Absolutely worth watching on IMAX!`,
      });
      await sampleReview.save();

      movie.reviews.push(sampleReview._id);
      await movie.save();
    }

    console.log("✅ BookMyShow database successfully seeded with realistic blockbusters & schedules!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding Error:", err);
    process.exit(1);
  }
};

seedDatabase();
