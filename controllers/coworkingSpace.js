const CoworkingSpace = require("../models/CoworkingSpace.js");
const Reservation = require("../models/Reservation.js");
const MeetingRoom = require("../models/MeetingRoom.js");

//@desc     Get all coworkingSpace
//@route    GET /api/coworkingSpace
//@access   Public
exports.getCoworkingSpaces = async (req, res, next) => {
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

    query = CoworkingSpace.find(JSON.parse(queryStr)).populate("meetingRooms");

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
    const total = await CoworkingSpace.countDocuments();

    query = query.skip(startIndex).limit(limit);

    // Execute query
    const coWorkingSpaces = await query;

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
      count: coWorkingSpaces.length,
      pagination,
      data: coWorkingSpaces,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false });
  }
};

//@desc     Get single coworkingSpace
//@route    GET /api/coworkingSpace/:id
//@access   Public
exports.getCoworkingSpace = async (req, res, next) => {
  try {
    const coworkingSpace = await CoworkingSpace.findById(
      req.params.id,
    ).populate("meetingRooms");

    if (!coworkingSpace) {
      return res.status(400).json({ success: false });
    }

    res.status(200).json({ success: true, data: coworkingSpace });
  } catch (error) {
    res.status(400).json({ success: false });
  }
};

//@desc     Create new coworkingSpace
//@route    POST /api/coworkingSpace
//@access   Private
exports.createCoworkingSpace = async (req, res, next) => {
  try {
    const coworkingSpace = await CoworkingSpace.create(req.body);

    if (!coworkingSpace) {
      return res.status(400).json({ success: false });
    }

    res.status(201).json({
      success: true,
      data: coworkingSpace,
    });
  } catch (error) {
    return res.status(400).json({ success: false });
  }
};

//@desc     Update coworkingSpace
//@route    PUT /api/coworkingSpace/:id
//@access   Private
exports.updateCoworkingSpace = async (req, res, next) => {
  try {
    const coworkingSpace = await CoworkingSpace.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!coworkingSpace) {
      return res.status(400).json({ success: false });
    }

    res.status(200).json({ success: true, data: coworkingSpace });
  } catch (error) {
    return res.status(400).json({ success: false });
  }
};

//@desc     Delete coworkingSpace
//@route    DELETE /api/coworkingSpace/:id
//@access   Private
exports.deleteCoworkingSpace = async (req, res, next) => {
  try {
    const coworkingSpace = await CoworkingSpace.findById(req.params.id);

    if (!coworkingSpace) {
      return res.status(400).json({
        success: false,
        message: `Co-working Space not found with id of ${req.params.id}`,
      });
    }

    await MeetingRoom.deleteMany({
      coworkingSpace: req.params.id,
    });
    await CoworkingSpace.deleteOne({
      _id: req.params.id,
    });

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    return res.status(400).json({ success: false });
  }
};
