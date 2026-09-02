const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const theatreSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  chain: {
    type: String,
    enum: ["PVR", "INOX", "Cinepolis", "Miraj", "Carnival", "Independent"],
    default: "PVR",
  },
  city: {
    type: String,
    required: true,
    enum: ["Mumbai", "Delhi-NCR", "Bengaluru", "Hyderabad", "Pune", "Chennai", "Kolkata"],
    default: "Mumbai",
  },
  address: {
    type: String,
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [72.8258, 18.9986],
    },
  },
  amenities: [
    {
      type: String,
      default: ["Dolby Atmos 7.1", "IMAX Laser", "Recliner Seats", "Gourmet F&B", "Wheelchair Accessible"],
    },
  ],
  cancellationAvailable: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Theatre", theatreSchema);
