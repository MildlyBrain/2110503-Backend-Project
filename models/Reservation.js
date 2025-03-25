const mongoose = require("mongoose");

const ReservationSchema = new mongoose.Schema({
  reserveDateStart: {
    type: Date,
    required: true,
  },
  reserveDateEnd: {
    type: Date,
    required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  meetingRoom: {
    type: mongoose.Schema.ObjectId,
    ref: "MeetingRoom",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Reservation", ReservationSchema);
