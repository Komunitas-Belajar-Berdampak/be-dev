const mongoose = require('mongoose');

const { Schema } = mongoose;

const facultySchema = new Schema(
    {
        namaFakultas: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        },
        kodeFakultas: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        },
    },
    {
        timestamps: true,
    },
);

const Faculty = mongoose.model('Faculty', facultySchema);

module.exports = Faculty;