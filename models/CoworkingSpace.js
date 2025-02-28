const mongoose = require("mongoose");

const CoworkingSpaceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            require: [true, "Plaese add Co-working Space name"],
        },
        address: {
            type: String,
            required: [true, "Please add an address"],
        },
        district: {
            type: String,
            required: [true, "Please add a district"],
        },
        province: {
            type: String,
            required: [true, "Please add a province"],
        },
        postalcode: {
            type: String,
            required: [true, "Please add a postalcode"],
            maxLength: [5, "Postal Code can not be more than 5 digits"],
        },
        tel: {
            type: String,
        },
        region: {
            type: String,
            required: [true, "Please add a region"],
        },
        open_time: {
            type: Date,
            required: true,
        },
        close_time: {
            type: Date,
            required: true,
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

//Reverse populate with virtuals
CoworkingSpaceSchema.virtual("meetingRooms", {
    ref: "MeetingRoom",
    localField: "_id",
    foreignField: "coworkingSpace",
    justone: false,
});

module.exports = mongoose.model("CoworkingSpace", CoworkingSpaceSchema);
