const Reservation = require("../models/Reservation");
const CoworkingSpace = require("../models/CoworkingSpace");
const MeetingRoom = require("../models/MeetingRoom");

//@desc		Get all reservation
//@route	GET /api/reservations/
//@access	Public
exports.getReservations = async (req, res, next) => {
    let query;

    if (req.user.role !== "admin") {
        query = Reservation.find({ user: req.user.id }).populate(
            {
                path: "meetingRoom",
                select: "roomNumber location",
                populate: {
                    path: "coworkingSpace",
                    select: "name addresss"
                }
            }
        );
    } else {
        //check if meetingRoomId
        if (req.params.meetingRoomId) {
            console.log(req.params.meetingRoomId);
            query = Reservation.find({
                meetingRoom: req.params.meetingRoomId,
            }).populate(
                {
                    path: "meetingRoom",
                    select: "roomNumber location ",
                    populate: {
                        path: "coworkingSpace",
                        select: "name addresss"
                    }
                }
            );
        } else {
            query = Reservation.find().populate(
                {
                    path: "meetingRoom",
                    select: "roomNumber location",
                    populate: {
                        path: "coworkingSpace",
                        select: "name addresss"
                    }
                }
            );
        }
    }

    try {
        const reservations = await query;

        res.status(200).json({
            success: true,
            count: reservations.length,
            data: reservations,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Cannot find reservations",
        });
    }
};

//@desc		Get single reservation
//@route	GET /api/reservations/:id
//@access	Public
exports.getReservation = async (req, res, next) => {
    try {
        const reservation = await Reservation.findById(req.params.id).populate(
            {
                path: "meetingRoom",
                select: "roomNumber location",
                populate: {
                    path: "coworkingSpace",
                    select: "name addresss"
                }
            }
        );

        if (
            reservation.user.toString() !== req.user.id &&
            req.user.role !== "admin"
        ) {
            return res.status(401).json({
                success: false,
                message: `User ${req.user.id} is not authorized to get this reservation`,
            });
        }

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: `No reservation with the id of ${req.params.id}`,
            });
        }

        res.status(200).json({
            success: true,
            data: reservation
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Cannot find reservation",
        });
    }
};

//@desc     Add reservation
//@route    POST/api/meetingRooms/:meetingRoomId/reservation
//@access   Private
exports.addReservation = async (req, res, next) => {
    try {
        req.body.meetingRoom = req.params.meetingRoomId;
        const meetingRoom = await MeetingRoom.findById(
            req.params.meetingRoomId
        ).populate({
            path: "coworkingSpace",
            select: "open_time close_time"
        });
        if (!meetingRoom) {
            return res.status(404).json({
                success: false,
                message: `No meeting room with the id of ${req.params.meetingRoomId}`,
            });
        }
        //add user Id to req.body
        req.body.user = req.user.id;
        //Check for existed reservation
        const existedReservation = await Reservation.find({
            user: req.user.id,
        });
        //If the user is not an admin, they can only create 3 reservation.
        if (existedReservation.length >= 3 && req.user.role !== "admin") {
            return res.status(400).json({
                success: false,
                message: `The user with ID ${req.user.id} has already made 3 reservations`,
            });
        }
        // Validate that reserveDateStart is before reserveDateEnd
        if (new Date(req.body.reserveDateStart) >= new Date(req.body.reserveDateEnd)) {
            return res.status(400).json({
                success: false,
                message: "Reservation start time must be before end time.",
            });
        }

        const getMinutesSinceMidnight = (date) => {
            console.log(date.getUTCHours(), date.getUTCMinutes());
            return date.getUTCHours() * 60 + date.getUTCMinutes();
        };

        const reserveStart = new Date(req.body.reserveDateStart);
        const reserveEnd = new Date(req.body.reserveDateEnd);

        // Validate that reserveDateStart is before reserveDateEnd
        if (reserveStart >= reserveEnd) {
            return res.status(400).json({
                success: false,
                message: "Reservation start time must be before end time.",
            });
        }

        // Extract coworking space open-close times
        const { open_time, close_time } = meetingRoom.coworkingSpace;
        console.log(open_time, close_time);

        // Convert times to minutes since midnight
        const openMinutes = getMinutesSinceMidnight(new Date(open_time));
        const closeMinutes = getMinutesSinceMidnight(new Date(close_time));
        const reserveStartMinutes = getMinutesSinceMidnight(reserveStart);
        const reserveEndMinutes = getMinutesSinceMidnight(reserveEnd);

        console.log(openMinutes, closeMinutes, reserveStartMinutes, reserveEndMinutes);

        // Check if reservation falls within coworking space open hours
        if (reserveStartMinutes < openMinutes || reserveEndMinutes > closeMinutes) {
            return res.status(400).json({
                success: false,
                message: `Reservation must be between ${new Date(open_time).toTimeString().slice(0, 5)} and ${new Date(close_time).toTimeString().slice(0, 5)}.`,
            });
        }
        //check if this room is already reserved by other reservation in same meetingRoom during the reserveDateStart and reserveDateEnd or not
        // ---fill code--
        const overlappingReservation = await Reservation.findOne({
            meetingRoom: req.body.meetingRoom,
            $or: [
                {
                    reserveDateStart: { $lt: req.body.reserveDateEnd },
                    reserveDateEnd: { $gt: req.body.reserveDateStart }
                }
            ]
        });

        if (overlappingReservation) {
            return res.status(400).json({
                success: false,
                message: `The meeting room is already reserved from ${overlappingReservation.reserveDateStart} to ${overlappingReservation.reserveDateEnd}. Please choose another time slot.`,
            });
        }

        const reservation = await Reservation.create(req.body);
        res.status(201).json({
            success: true,
            data: reservation,
        });
    } catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ success: false, message: "Cannot create reservation" });
    }
};

//@desc		Update reservation
//@route	PUT /api/reservations/:id
//@access	Private
exports.updateReservation = async (req, res, next) => {
    try {
        let reservation = await Reservation.findById(req.params.id);

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: `No reservation with the id of ${req.params.id}`,
            });
        }

        // Make sure user is the reservation owner
        if (
            reservation.user.toString() !== req.user.id &&
            req.user.role !== "admin"
        ) {
            return res.status(401).json({
                success: false,
                message: `User ${req.user.id} is not authorized to update this reservation`,
            });
        }

        reservation = await Reservation.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );

        res.status(200).json({
            success: true,
            data: reservation,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Cannot update reservation",
        });
    }
};

//@desc		Delete reservation
//@route	DELETE /api/reservations/:id
//@access	Private
exports.deleteReservation = async (req, res, next) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: `No reservation with the id of ${req.params.id}`,
            });
        }

        // Make sure user is the reservation owner
        if (
            reservation.user.toString() !== req.user.id &&
            req.user.role !== "admin"
        ) {
            return res.status(401).json({
                success: false,
                message: `User ${req.user.id} is not authorized to delete this reservation`,
            });
        }

        await reservation.deleteOne();

        res.status(200).json({
            success: true,
            data: {},
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Cannot delete reservation",
        });
    }
};
