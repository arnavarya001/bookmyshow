const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const movieSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  synopsis: {
    type: String,
    required: true,
  },
  genre: [
    {
      type: String,
      trim: true,
    },
  ],
  language: [
    {
      type: String,
      trim: true,
    },
  ],
  duration: {
    type: Number, // in minutes, e.g. 166
    required: true,
  },
  releaseDate: {
    type: Date,
    default: Date.now,
  },
  rating: {
    type: Number, // out of 10
    default: 8.5,
    min: 0,
    max: 10,
  },
  votesCount: {
    type: Number,
    default: 1240,
  },
  certificate: {
    type: String,
    enum: ["U", "UA", "UA 16+", "A", "PG-13", "R"],
    default: "UA",
  },
  format: [
    {
      type: String,
      default: ["2D"],
    },
  ],
  poster: {
    url: {
      type: String,
      required: true,
    },
    filename: String,
  },
  backdrop: {
    url: {
      type: String,
      required: true,
    },
    filename: String,
  },
  trailerUrl: {
    type: String,
    default: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  cast: [
    {
      name: String,
      role: String,
      photo: String,
    },
  ],
  director: {
    type: String,
    default: "Renowned Director",
  },
  isTrending: {
    type: Boolean,
    default: false,
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Movie = mongoose.model("Movie", movieSchema);
module.exports = Movie;
