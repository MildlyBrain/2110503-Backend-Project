const express = require("express");

const router = express.Router({ mergeParams: true });
const { protect, authorize } = require("../middleware/auth");

const meetingRoomRouter = require("./meetingRooms");
const {
  getCoworkingSpaces,
  getCoworkingSpace,
  createCoworkingSpace,
  updateCoworkingSpace,
  deleteCoworkingSpace,
} = require("../controllers/coworkingSpace");

router.use("/:coworkingSpaceId/meetingRooms/", meetingRoomRouter); //find meetingrooms by coworkingspace

router
  .route("/")
  .get(getCoworkingSpaces)
  .post(protect, authorize("admin"), createCoworkingSpace);
router
  .route("/:id")
  .get(getCoworkingSpace)
  .put(protect, authorize("admin"), updateCoworkingSpace)
  .delete(protect, authorize("admin"), deleteCoworkingSpace);

module.exports = router;
