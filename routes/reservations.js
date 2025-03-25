const express = require("express");

const {
  getReservations,
  getReservation,
  addReservation,
  updateReservation,
  deleteReservation,
} = require("../controllers/reservations");

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require("../middleware/auth");

router.route("/").get(protect, getReservations).post(protect, addReservation);
router
  .route("/:id")
  .get(protect, getReservation)
  .put(protect, updateReservation)
  .delete(protect, deleteReservation);

module.exports = router;
