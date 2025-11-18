const mongoose = require('mongoose');

const { Schema } = mongoose;

const materialSchema = new Schema(
    {
        idMeeting: {
        type: Schema.Types.ObjectId,
        ref: 'Meeting',
        required: true,
        },
        idCourse: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
        },
        pathFile: {
        type: String,
        required: true,
        trim: true,
        },
        namaFile: {
        type: String,
        required: true,
        trim: true,
        },
        tipe: {
        type: String,
        required: true,
        trim: true,
        },
        deskripsi: {
        type: Schema.Types.Mixed, 
        },
        status: {
        type: String,
        enum: ['HIDE', 'VISIBLE'],
        default: 'HIDE',
        },
    },
    {
        timestamps: true,
    },
);

materialSchema.index({ idCourse: 1, idMeeting: 1 });

const Material = mongoose.model('Material', materialSchema);

module.exports = Material;
