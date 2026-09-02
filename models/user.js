const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    default: null,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  watchlist: [
    {
      type: Schema.Types.ObjectId,
      ref: "Movie",
    },
  ],
  avatar: {
    type: String,
    default: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.plugin(passportLocalMongoose.default || passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
