const mongoose = require('mongoose');

const { Schema } = mongoose;

const roleSchema = new Schema(
    {
        nama: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
    },
    {
        timestamps: true,
    },
);

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;