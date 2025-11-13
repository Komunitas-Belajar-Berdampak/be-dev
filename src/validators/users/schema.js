const Joi = require('joi');

const createUserSchema = Joi.object({
    nrp: Joi.string().trim().required(),
    idRole: Joi.string().required(),   // satu role utama untuk create
    idProdi: Joi.string().required(),
    nama: Joi.string().trim().required(),
    angkatan: Joi.string().trim().required(),
    email: Joi.string().email().required(),
    alamat: Joi.string().allow('', null),
    jenisKelamin: Joi.string().valid('pria', 'wanita').required(),
    status: Joi.string().valid('aktif', 'tidak aktif').required(),
    password: Joi.string().min(6).required(),
    fotoProfil: Joi.string().allow('', null),
});

const updateUserSchema = Joi.object({
    nrp: Joi.string().trim().optional(),
    idRole: Joi.string().optional(),
    idProdi: Joi.string().optional(),
    nama: Joi.string().trim().optional(),
    angkatan: Joi.string().trim().optional(),
    email: Joi.string().email().optional(),
    alamat: Joi.string().allow('', null).optional(),
    jenisKelamin: Joi.string().valid('pria', 'wanita').optional(),
    status: Joi.string().valid('aktif', 'tidak aktif').optional(),
    password: Joi.string().min(6).optional(),
    fotoProfil: Joi.string().allow('', null).optional(),
}).min(1); // minimal ada 1 field yang diubah

const patchUserSchema = Joi.object({
    passwordLama: Joi.string().optional(),
    passwordBaru: Joi.string().min(6).optional(),
    fotoProfil: Joi.string().allow('', null).optional(),
    alamat: Joi.string().allow('', null).optional(),
    nama: Joi.string().trim().optional(),
})
    .custom((value, helpers) => {
        if (value.passwordBaru && !value.passwordLama) {
        return helpers.message(
            'passwordLama wajib diisi saat mengganti password',
        );
        }
        return value;
    })
    .min(1);

module.exports = {
    createUserSchema,
    updateUserSchema,
    patchUserSchema,
};