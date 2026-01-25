const mongoose = require('mongoose');
const PrivateFile = require('./private-file.model');
const { ApiError } = require('../../utils/http');
const { parsePagination, buildPagination } = require('../../utils/pagination');

const mapItem = (doc) => ({
    id: doc._id.toString(),
    file: {
        nama: doc.namaFile,
        path: doc.pathFile,
        size: doc.size,
        tipe: doc.tipe || null,
    },
    status: doc.status,
});

const listByUser = async (userId, query) => {
    if (!mongoose.isValidObjectId(userId)) throw new ApiError(400, 'ID user tidak valid');

    const { page, limit, skip } = parsePagination(query);

    const filter = { idMahasiswa: userId };
    const totalItems = await PrivateFile.countDocuments(filter);

    const docs = await PrivateFile.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    return {
        items: docs.map(mapItem),
        pagination: buildPagination({ page, limit, totalItems }),
    };
};

const createForUser = async (userId, { filePath, fileSize, status, tipe }) => {
    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, 'ID user tidak valid');
    }

    const namaFile = filePath.split('/').pop() || filePath;

    const doc = await PrivateFile.create({
        idMahasiswa: userId,
        namaFile,
        pathFile: filePath,
        size: fileSize,
        tipe: tipe || null,
        status: status || 'PRIVATE',
    });

    return mapItem(doc.toObject());
};

const updateStatus = async (userId, idFile, status) => {
    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(idFile)) {
        throw new ApiError(400, 'ID tidak valid');
    }

    const doc = await PrivateFile.findOne({
        _id: idFile,
        idMahasiswa: userId,
    });

    if (!doc) {
        throw new ApiError(404, 'File tidak ditemukan');
    }

    doc.status = status;
    await doc.save();
};

const deleteFile = async (userId, idFile) => {
    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(idFile)) {
        throw new ApiError(400, 'ID tidak valid');
    }

    const deleted = await PrivateFile.findOneAndDelete({
        _id: idFile,
        idMahasiswa: userId,
    });

    if (!deleted) {
        throw new ApiError(404, 'File tidak ditemukan');
    }
};

module.exports = {
    listByUser,
    createForUser,
    updateStatus,
    deleteFile,
};
