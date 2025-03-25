const MeetingRoom = require("../models/MeetingRoom");
const Reservation = require("../models/Reservation");
const CoworkingSpace = require("../models/CoworkingSpace");

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
      (match) => `$${match}`,
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
        return res
          .status(400)
          .json({ success: false, message: "Invalid date format" });
      }

      // Find reservations that overlap with the requested date range
      const reservedRooms = await Reservation.find({
        reserveDateEnd: { $gte: new Date() }, // Ignore past reservations
        reserveDateStart: { $lt: end },
        reserveDateEnd: { $gt: start }, // Overlapping reservations
      }).distinct("meetingRoom");
      console.log(reservedRooms);

      // Define a fixed date for open/close time comparison
      const fixedDate = "2025-04-19";

      // Extract time in UTC and merge with fixed date
      const adjustedStart = new Date(
        `${fixedDate}T${String(start.getUTCHours()).padStart(2, "0")}:${String(start.getUTCMinutes()).padStart(2, "0")}:00.000Z`,
      );
      const adjustedEnd = new Date(
        `${fixedDate}T${String(end.getUTCHours()).padStart(2, "0")}:${String(end.getUTCMinutes()).padStart(2, "0")}:00.000Z`,
      );

      console.log("Adjusted Start:", adjustedStart);
      console.log("Adjusted End:", adjustedEnd);

      // Get meeting rooms that are in coworking spaces that are closed during the requested reservation period
      const closedCoworkingSpaces = await CoworkingSpace.find({
        $or: [
          { open_time: { $gt: adjustedStart } }, // Requested start time is before open time
          { close_time: { $lt: adjustedEnd } }, // Requested end time is after close time
        ],
      }).distinct("_id");

      console.log("Closed coworking spaces:", closedCoworkingSpaces);

      // Add filtering condition to exclude reserved and unavailable meeting rooms
      filters._id = { $nin: reservedRooms };
      // Check if also filtered by coworkingSpaceId
      if (req.params.coworkingSpaceId)
        filters.coworkingSpace = {
          $eq: req.params.coworkingSpaceId,
          $nin: closedCoworkingSpaces,
          // filter closed coworkingspace
        };
      else
        filters.coworkingSpace = {
          $nin: closedCoworkingSpaces,
        };
    }

    // Build query
    query = MeetingRoom.find(filters).populate({
      path: "coworkingSpace",
      select: "name address open_time close_time",
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
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await MeetingRoom.countDocuments();

    query = query.skip(startIndex).limit(limit);

    // Execute query
    const meetingRooms = await query;

    // Pagination results
    const pagination = {};
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    res.status(200).json({
      success: true,
      count: meetingRooms.length,
      pagination,
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
      },
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
