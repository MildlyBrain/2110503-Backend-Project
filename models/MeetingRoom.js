const mongoose = require("mongoose");
const MeetingRoomSchema = new mongoose.Schema({
  roomNumber: {
    type: Number,
  },
  location: {
    type: String,
  },
  coworkingSpace: {
    type: mongoose.Schema.ObjectId,
    ref: "CoworkingSpace",
    required: true,
  },
  capacity: {
    type: Number,
  },
  projector: {
    type: Boolean,
  },
  whiteBoard: {
    type: Boolean,
  },
  ledTV: {
    type: Boolean,
  },
  speaker: {
    type: Boolean,
  },
});

module.exports = mongoose.model("MeetingRoom", MeetingRoomSchema);
