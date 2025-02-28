const MeetingRoom = require("../models/MeetingRoom");
const Reservation = require("../models/Reservation");

//@desc     Get all meetingRooms
//@route    GET /api/meetingrooms
//@access   Public
exports.getMeetingRooms = async (req, res, next) => {
    try {
        let query;

        // Copy req.query
        const reqQuery = { ...req.query };

        // Fields to exclude
        const removeFields = ["select", "sort", "page", "limit"];

        // Loop over remove fields and delete them from reqQuery
        removeFields.forEach((param) => delete reqQuery[param]);
        console.log(reqQuery);

        let queryStr = JSON.stringify(req.query);
        queryStr = queryStr.replace(
            /\b(gt|gte|lt|lte|in)\b/g,
            (match) => `$${match}`
        );

        let filters = JSON.parse(queryStr);
        // Check if filtering by coworkingSpaceId
        if (req.params.coworkingSpaceId) {
            filters.coworkingSpace = req.params.coworkingSpaceId;
        }

        // Extract filtering dates
        const { reserveDateStart, reserveDateEnd } = req.query;

        if (reserveDateStart && reserveDateEnd) {
            const start = new Date(reserveDateStart);
            const end = new Date(reserveDateEnd);
            console.log(start);
            console.log(end);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({ success: false, message: "Invalid date format" });
            }

            // Find reservations that overlap with the requested date range
            const reservedRooms = await Reservation.find({
                reserveDateEnd: { $gte: new Date() }, // Ignore past reservations
                $or: [
                    { reserveDateStart: { $lt: end }, reserveDateEnd: { $gt: start } } // Overlapping reservations
                ]
            }).distinct("meetingRoom");
            console.log(reservedRooms);

            // Add filtering condition to exclude reserved meeting rooms
            filters._id = { $nin: reservedRooms };
        }

        // Build query
        query = MeetingRoom.find(filters).populate({
            path: "coworkingSpace",
            select: "name address",
        });
        
        
        
        // Select fields
        if (req.query.select) {
            const fields = req.query.select.split(",").join(" ");
            query = query.select(fields);
        }

        // Sort
        if (req.query.sort) {
            const sortBy = req.query.sort.split(",").join(" ");
            query = query.sort(sortBy);
        } else {
            query = query.sort("-createdAt");
        }
        


        // Pagination
        // const page = parseInt(req.query.page, 10) || 1;
        // const limit = parseInt(req.query.limit, 10) || 25;
        // const startIndex = (page - 1) * limit;
        // const endIndex = page * limit;
        // const total = await MeetingRoom.countDocuments();

        // query = query.skip(startIndex).limit(limit);

        // Execute query
        const meetingRooms = await query;

        // Pagination results
        // const pagination = {};
        // if (endIndex < total) {
        //     pagination.next = {
        //         page: page + 1,
        //         limit,
        //     };
        // }

        // if (startIndex > 0) {
        //     pagination.prev = {
        //         page: page - 1,
        //         limit,
        //     };
        // }

        res.status(200).json({
            success: true,
            count: meetingRooms.length,
            // pagination,
            data: meetingRooms,
        });
    } catch (error) {
        res.status(400).json({ success: false });
    }
};

//@desc     Get single meetingRoom
//@route    GET /api/meetingrooms/:id
//@access   Public
exports.getMeetingRoom = async (req, res, next) => {
    try {
        const meetingRoom = await MeetingRoom.findById(req.params.id).populate({
            path: "coworkingSpace",
            select: "name address",
        });

        if (!meetingRoom) {
            return res.status(400).json({ success: false });
        }

        res.status(200).json({ success: true, data: meetingRoom });
    } catch (error) {
        res.status(400).json({ success: false });
    }
};

//@desc     Create new meetingRoom
//@route    POST /api/meetingrooms
//@access   Private
exports.createMeetingRoom = async (req, res, next) => {
    try {
        const meetingRoom = await MeetingRoom.create(req.body);

        if (!meetingRoom) {
            return res.status(400).json({ success: false });
        }

        res.status(201).json({
            success: true,
            data: meetingRoom,
        });
    } catch (error) {
        return res.status(400).json({ success: false });
    }
};

//@desc     Update meetingRoom
//@route    PUT /api/meetingrooms/:id
//@access   Private
exports.updateMeetingRoom = async (req, res, next) => {
    try {
        const meetingRoom = await MeetingRoom.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!meetingRoom) {
            return res.status(400).json({ success: false });
        }

        res.status(200).json({ success: true, data: meetingRoom });
    } catch (error) {
        return res.status(400).json({ success: false });
    }
};

//@desc     Delete meetingRoom
//@route    DELETE /api/meetingrooms/:id
//@access   Private
exports.deleteMeetingRoom = async (req, res, next) => {
    try {
        const meetingRoom = await MeetingRoom.findById(req.params.id);

        if (!meetingRoom) {
            return res.status(400).json({
                success: false,
                message: `meetingRoom not found with id of ${req.params.id}`,
            });
        }

        await Reservation.deleteMany({
            meetingRoom: req.params.id,
        });
        await MeetingRoom.deleteOne({
            _id: req.params.id,
        });

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        return res.status(400).json({ success: false });
    }
};
