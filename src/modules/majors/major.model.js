const mongoose = require('mongoose');

const { Schema } = mongoose;

const majorSchema = new Schema(
    {
        kodeProdi: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        namaProdi: {
            type: String,
            required: true,
            trim: true,
        },
        idFakultas: {
            type: Schema.Types.ObjectId,
            ref: 'Faculty', 
            required: true,
        },
    },
    {
        timestamps: true,
    },
);

const Major = mongoose.model('Major', majorSchema);

module.exports = Major;