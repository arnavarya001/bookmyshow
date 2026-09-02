const Booking = require("../models/booking");
const Show = require("../models/show");
const Movie = require("../models/movie");
const Theatre = require("../models/theatre");
const Razorpay = require("razorpay");
const crypto = require("crypto");

// Helper: Get Razorpay instance if keys are available
function getRazorpayInstance() {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    return new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return null;
}

// Helper: Generate unique Booking ID
function generateBookingId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "BMS-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// POST /bookings/checkout - Prepare booking & calculate costs
module.exports.initiateBooking = async (req, res, next) => {
  try {
    const { showId, selectedSeats, seatCategory, selectedSnacks } = req.body;

    if (!selectedSeats) {
      req.flash("error", "Please select at least one seat!");
      return res.redirect(`/shows/${showId}/seats`);
    }

    const seatsArray = Array.isArray(selectedSeats)
      ? selectedSeats
      : selectedSeats.split(",").map((s) => s.trim()).filter(Boolean);

    if (seatsArray.length === 0) {
      req.flash("error", "Please select at least one seat!");
      return res.redirect(`/shows/${showId}/seats`);
    }

    const show = await Show.findById(showId).populate("movie").populate("theatre");
    if (!show) {
      req.flash("error", "Show not found!");
      return res.redirect("/movies");
    }

    // Check if any seat is already booked
    const alreadyBooked = seatsArray.some((seat) => show.bookedSeats.includes(seat));
    if (alreadyBooked) {
      req.flash("error", "One or more chosen seats were just booked. Please select different seats.");
      return res.redirect(`/shows/${showId}/seats`);
    }

    // Calculate ticket prices
    const category = seatCategory || "Prime";
    const seatRate =
      category.toLowerCase() === "recliner"
        ? show.priceTiers.recliner
        : category.toLowerCase() === "classic"
        ? show.priceTiers.classic
        : show.priceTiers.prime;

    const ticketAmount = seatRate * seatsArray.length;

    // Parse snacks
    let parsedSnacks = [];
    let snacksAmount = 0;
    if (selectedSnacks) {
      try {
        const rawSnacks = typeof selectedSnacks === "string" ? JSON.parse(selectedSnacks) : selectedSnacks;
        parsedSnacks = Object.keys(rawSnacks)
          .filter((k) => rawSnacks[k].quantity > 0)
          .map((k) => ({
            name: rawSnacks[k].name,
            quantity: Number(rawSnacks[k].quantity),
            price: Number(rawSnacks[k].price),
          }));

        snacksAmount = parsedSnacks.reduce((sum, item) => sum + item.price * item.quantity, 0);
      } catch (e) {
        console.error("Snack parse error:", e);
      }
    }

    // Base total & convenience fee (e.g. ₹35 per ticket + 18% GST)
    const baseFee = seatsArray.length * 35;
    const convenienceFee = Math.round(baseFee * 1.18);
    const grandTotal = ticketAmount + snacksAmount + convenienceFee;

    // Razorpay Order Creation (if keys provided; otherwise mock order for testing)
    let orderId = `order_mock_${Date.now()}`;
    const razorpay = getRazorpayInstance();

    if (razorpay) {
      try {
        const rzpOrder = await razorpay.orders.create({
          amount: grandTotal * 100, // in paise
          currency: "INR",
          receipt: `rcpt_${Date.now()}`.slice(0, 40),
        });
        orderId = rzpOrder.id;
      } catch (err) {
        console.warn("Razorpay API warning (using test checkout):", err.message);
      }
    }

    // Store in session for payment verification
    req.session.pendingBMSBooking = {
      showId: show._id.toString(),
      movieId: show.movie._id.toString(),
      theatreId: show.theatre._id.toString(),
      showDate: show.showDate,
      showTime: show.showTime,
      format: show.format,
      seats: seatsArray,
      seatCategory: category,
      snacks: parsedSnacks,
      ticketAmount,
      snacksAmount,
      convenienceFee,
      grandTotal,
      orderId,
    };

    req.session.save((err) => {
      if (err) return next(err);
      return res.render("bookings/payment", {
        show,
        seats: seatsArray,
        seatCategory: category,
        ticketAmount,
        snacks: parsedSnacks,
        snacksAmount,
        convenienceFee,
        grandTotal,
        orderId,
        razorpayKey: process.env.RAZORPAY_KEY_ID || "rzp_test_mock_key",
        user: req.user,
      });
    });
  } catch (err) {
    return next(err);
  }
};

// POST /bookings/verify-payment - Confirm booking and issue digital ticket
module.exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, test_mode } = req.body;

    const pending = req.session.pendingBMSBooking;
    if (!pending) {
      req.flash("error", "Booking session expired! Please select your seats again.");
      return res.redirect("/movies");
    }

    // If live Razorpay keys are configured and this is not a test mode submit, verify signature
    if (process.env.RAZORPAY_KEY_SECRET && !test_mode && razorpay_signature) {
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        req.flash("error", "Payment verification failed! Please try again.");
        return res.redirect(`/shows/${pending.showId}/seats`);
      }
    }

    // Lock seats in the Show model
    const show = await Show.findById(pending.showId);
    if (!show) {
      req.flash("error", "Show not found!");
      return res.redirect("/movies");
    }

    show.bookedSeats.push(...pending.seats);
    await show.save();

    const bookingId = generateBookingId();
    const qrData = `BOOKING:${bookingId}|MOVIE:${pending.movieId}|SEATS:${pending.seats.join(",")}|DATE:${new Date(pending.showDate).toLocaleDateString()}|TIME:${pending.showTime}`;

    // Create confirmed booking
    const newBooking = new Booking({
      bookingId,
      user: req.user._id,
      movie: pending.movieId,
      theatre: pending.theatreId,
      show: pending.showId,
      showDate: pending.showDate,
      showTime: pending.showTime,
      format: pending.format,
      seats: pending.seats,
      seatCategory: pending.seatCategory,
      snacks: pending.snacks,
      ticketAmount: pending.ticketAmount,
      snacksAmount: pending.snacksAmount,
      convenienceFee: pending.convenienceFee,
      grandTotal: pending.grandTotal,
      orderId: razorpay_order_id || pending.orderId,
      paymentId: razorpay_payment_id || `PAY_MOCK_${Date.now()}`,
      paymentStatus: "paid",
      qrCode: qrData,
    });

    await newBooking.save();

    // Clear session
    delete req.session.pendingBMSBooking;

    req.flash("success", `🎉 Booking Confirmed! Ticket ID: ${bookingId}`);
    return res.redirect(`/bookings/ticket/${newBooking._id}`);
  } catch (err) {
    return next(err);
  }
};

// GET /bookings/ticket/:id - Digital Movie Ticket
module.exports.viewTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate("movie")
      .populate("theatre")
      .populate("show")
      .populate("user", "username email phone");

    if (!booking) {
      req.flash("error", "Ticket not found!");
      return res.redirect("/movies");
    }

    // Ensure only the ticket owner or admin can view
    if (!booking.user.equals(req.user._id) && req.user.role !== "admin") {
      req.flash("error", "Unauthorized access to this ticket!");
      return res.redirect("/movies");
    }

    return res.render("bookings/ticket", { booking });
  } catch (err) {
    return next(err);
  }
};

// GET /bookings/history - Booking History
module.exports.bookingHistory = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("movie")
      .populate("theatre")
      .populate("show")
      .sort({ createdAt: -1 });

    return res.render("bookings/history", { bookings });
  } catch (err) {
    return next(err);
  }
};

// POST /bookings/:id/cancel - Cancel ticket
module.exports.cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      req.flash("error", "Booking not found!");
      return res.redirect("/bookings/history");
    }

    if (!booking.user.equals(req.user._id) && req.user.role !== "admin") {
      req.flash("error", "Unauthorized to cancel this ticket!");
      return res.redirect("/bookings/history");
    }

    // Release seats in the Show model
    await Show.findByIdAndUpdate(booking.show, {
      $pull: { bookedSeats: { $in: booking.seats } },
    });

    booking.paymentStatus = "cancelled";
    await booking.save();

    req.flash("success", "Ticket cancelled successfully. Refund will be processed in 3-5 business days.");
    return res.redirect("/bookings/history");
  } catch (err) {
    return next(err);
  }
};
