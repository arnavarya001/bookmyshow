const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const showSchema = new Schema({
  movie: {
    type: Schema.Types.ObjectId,
    ref: "Movie",
    required: true,
  },
  theatre: {
    type: Schema.Types.ObjectId,
    ref: "Theatre",
    required: true,
  },
  screen: {
    type: String,
    default: "Audi 1",
  },
  showDate: {
    type: Date,
    required: true,
  },
  showTime: {
    type: String, // e.g. "10:30 AM", "02:15 PM", "06:45 PM", "09:30 PM"
    required: true,
  },
  format: {
    type: String,
    enum: ["2D", "3D", "IMAX 3D", "4DX", "ICE"],
    default: "2D",
  },
  language: {
    type: String,
    default: "English",
  },
  priceTiers: {
    classic: { type: Number, default: 220 },
    prime: { type: Number, default: 350 },
    recliner: { type: Number, default: 600 },
  },
  bookedSeats: [
    {
      type: String, // e.g. "A1", "C4", "G10"
    },
  ],
  totalRows: {
    type: Number,
    default: 8, // Rows A to H
  },
  seatsPerRow: {
    type: Number,
    default: 12, // 1 to 12
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Show", showSchema);
