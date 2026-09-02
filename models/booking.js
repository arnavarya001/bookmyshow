const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
    show: {
      type: Schema.Types.ObjectId,
      ref: "Show",
      required: true,
    },
    showDate: {
      type: Date,
      required: true,
    },
    showTime: {
      type: String,
      required: true,
    },
    format: {
      type: String,
      default: "2D",
    },
    seats: [
      {
        type: String, // e.g. ["D5", "D6"]
        required: true,
      },
    ],
    seatCategory: {
      type: String,
      default: "Prime",
    },
    snacks: [
      {
        name: String,
        quantity: Number,
        price: Number,
      },
    ],
    ticketAmount: {
      type: Number,
      required: true,
    },
    snacksAmount: {
      type: Number,
      default: 0,
    },
    convenienceFee: {
      type: Number,
      required: true,
    },
    grandTotal: {
      type: Number,
      required: true,
    },
    paymentId: {
      type: String,
      default: null,
    },
    orderId: {
      type: String,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "cancelled"],
      default: "paid",
    },
    qrCode: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
