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
        );
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

        await Reservation.deleteOne();

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
