const Role = require('./roles.model');
const { ApiError } = require('../../utils/http');

const listRoles = async () => {
    const roles = await Role.find().sort({ nama: 1 }).lean();
    return roles;
};

const createRole = async ({ nama }) => {
    const exists = await Role.findOne({
        nama: { $regex: `^${nama}$`, $options: 'i' },
    });

    if (exists) {
        throw new ApiError(400, 'Nama role sudah digunakan');
    }

    const role = await Role.create({ nama });
    return role.toObject();
};

const updateRole = async (id, { nama }) => {
    const role = await Role.findById(id);

    if (!role) {
        throw new ApiError(404, 'Role tidak ditemukan');
    }

    if (nama && nama !== role.nama) {
        const exists = await Role.findOne({
            _id: { $ne: id },
            nama: { $regex: `^${nama}$`, $options: 'i' },
        });
        if (exists) {
            throw new ApiError(400, 'Nama role sudah digunakan');
        }
        role.nama = nama;
    }

    await role.save();
    return role.toObject();
};

const deleteRole = async (id) => {
    const role = await Role.findByIdAndDelete(id);
    if (!role) {
        throw new ApiError(404, 'Role tidak ditemukan');
    }
};

module.exports = {
    listRoles,
    createRole,
    updateRole,
    deleteRole,
};