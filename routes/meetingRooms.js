const express = require("express");

const router = express.Router({ mergeParams: true });
const { protect, authorize } = require("../middleware/auth");

const reservationRouter = require("./reservations");
const {
  getMeetingRooms,
  getMeetingRoom,
  createMeetingRoom,
  updateMeetingRoom,
  deleteMeetingRoom,
} = require("../controllers/meetingRooms");

router
  .route("/")
  .get(getMeetingRooms)
  .post(protect, authorize("admin"), createMeetingRoom);
router
  .route("/:id")
  .get(getMeetingRoom)
  .put(protect, authorize("admin"), updateMeetingRoom)
  .delete(protect, authorize("admin"), deleteMeetingRoom);
router.use("/:meetingRoomId/reservations/", reservationRouter); // find reservations by meetingroom

module.exports = router;
