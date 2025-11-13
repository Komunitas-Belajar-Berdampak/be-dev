// src/seeds/seed.js
require('dotenv').config();
const mongoose = require('mongoose');

const config = require('../config');
const Role = require('../modules/roles/roles.model');
const User = require('../modules/users/user.model');
const { hashPassword } = require('../modules/auth/auth.utils');

async function main() {
    try {
        console.log('[seed] connecting to MongoDB:', config.mongoUri);
        await mongoose.connect(config.mongoUri);
        console.log('[seed] MongoDB connected');

        let superAdminRole = await Role.findOne({
        nama: { $regex: '^SUPER_ADMIN$', $options: 'i' },
        });

        if (!superAdminRole) {
        superAdminRole = await Role.create({ nama: 'SUPER_ADMIN' });
        console.log('[seed] Role SUPER_ADMIN dibuat');
        } else {
        console.log('[seed] Role SUPER_ADMIN sudah ada');
        }

        const targetNrp = 'Admin'; 
        const existing = await User.findOne({ nrp: targetNrp });

        if (existing) {
        console.log(
            `[seed] User dengan NRP ${targetNrp} sudah ada (id=${existing._id}), tidak dibuat ulang`,
        );
        } else {
        const passwordPlain = 'password123';
        const passwordHash = await hashPassword(passwordPlain);

        const user = await User.create({
            nrp: targetNrp,
            nama: 'Super Admin STA',
            angkatan: null,
            idProdi: null,
            email: 'admin@kampus.ac.id',
            alamat: 'Jl. Admin STA',
            jenisKelamin: 'pria',
            status: 'aktif',
            passwordHash,
            roleIds: [superAdminRole._id],
            fotoProfil: null,
        });

        console.log('[seed] User SUPER_ADMIN pertama berhasil dibuat:');
        console.log({
            id: user._id.toString(),
            nrp: user.nrp,
            email: user.email,
            password: passwordPlain,
        });
        }
    } catch (err) {
        console.error('[seed] Gagal menjalankan seed:', err);
    } finally {
        await mongoose.connection.close();
        console.log('[seed] MongoDB connection closed');
        process.exit(0);
    }
}

main();
