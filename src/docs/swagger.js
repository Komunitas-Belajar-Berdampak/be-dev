const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
        title: 'STA Backend API – Website Komunitas Belajar',
        version: '1.0.0',
        description:
            'Dokumentasi REST API untuk backend "Pengembangan Website Komunitas Belajar yang Berdampak".',
        },
        servers: [
        {
            url: 'http://localhost:3000',
            description: 'Development server',
        },
        ],
        components: {
        securitySchemes: {
            bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            },
        },
        schemas: {
            ErrorResponse: {
            type: 'object',
            properties: {
                status: { type: 'string', example: 'error' },
                message: { type: 'string', example: 'Some error message' },
            },
            },

            // AUTH 
            LoginRequest: {
            type: 'object',
            required: ['nrp', 'password'],
            properties: {
                nrp: { type: 'string', example: '2272002' },
                password: { type: 'string', example: 'password123' },
            },
            },
            LoginResponse: {
            type: 'object',
            properties: {
                status: { type: 'string', example: 'success' },
                message: { type: 'string', example: 'login berhasil!' },
                data: {
                type: 'object',
                properties: {
                    token: { type: 'string' },
                    user: {
                    type: 'object',
                    properties: {
                        nrp: { type: 'string', example: '2272002' },
                        nama: { type: 'string', example: 'Mahasiswa Testing' },
                        namaRole: { type: 'string', example: 'MAHASISWA' },
                    },
                    },
                },
                },
            },
            },

            // Roles 
            Role: {
                type: 'object',
                properties: {
                id: {
                    type: 'string',
                    example: '675abcde1234567890fffff1',
                },
                nama: {
                    type: 'string',
                    example: 'SUPER_ADMIN',
                },
                },
            },

            // USERS 
            UserListItem: {
            type: 'object',
            properties: {
                id: { type: 'string', example: '675abcdef1234567890abcd1' },
                nrp: { type: 'string', example: '2272002' },
                nama: { type: 'string', example: 'Mahasiswa Testing' },
                angkatan: { type: 'string', example: '2022' },
                prodi: { type: 'string', example: 'Teknik Informatika' },
                status: { type: 'string', example: 'aktif' },
                role: { type: 'string', example: 'MAHASISWA' },
            },
            },
            UserDetail: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                nrp: { type: 'string' },
                nama: { type: 'string' },
                namaRole: { type: 'string' },
                angkatan: { type: 'string' },
                prodi: { type: 'string' },
                email: { type: 'string' },
                alamat: { type: 'string' },
                jenisKelamin: { type: 'string', example: 'pria' },
                status: { type: 'string', example: 'aktif' },
                fotoProfil: { type: 'string', nullable: true },
            },
            },

            // ACADEMIC TERMS 
            AcademicTerm: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                periode: { type: 'string', example: '2025/2026 - Ganjil - Semester 7' },
                startDate: { type: 'string', format: 'date-time', nullable: true },
                endDate: { type: 'string', format: 'date-time', nullable: true },
                status: { type: 'string', example: 'aktif' },
            },
            },

            // FACULTY & MAJOR 
            Faculty: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                namaFakultas: { type: 'string', example: 'Fakultas Teknologi Rekayasa Cerdas' },
                kodeFakultas: { type: 'string', example: 'FTRC', nullable: true },
            },
            },
            Major: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                kodeProdi: { type: 'string', example: '72' },
                namaFakultas: { type: 'string', example: 'Fakultas Teknologi Rekayasa Cerdas' },
                namaProdi: { type: 'string', example: 'Teknik Informatika' },
            },
            },

            // COURSES & MEETINGS 
            CourseListItem: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                kodeMatkul: { type: 'string', example: 'IN243' },
                namaMatkul: { type: 'string', example: 'Analitik Kebijakan' },
                sks: { type: 'integer', example: 4 },
                status: { type: 'string', example: 'aktif' },
                periode: { type: 'string', example: '2025/2026 - Ganjil' },
                pengajar: { type: 'string', example: 'Nama Dosen' },
                kelas: { type: 'string', example: 'A' },
            },
            },
            Meeting: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                pertemuan: { type: 'integer', example: 1 },
                judul: { type: 'string', example: 'Array & Loop' },
                deskripsi: { type: 'object' },
            },
            },
            Material: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                namaFile: { type: 'string', example: 'slide-bab3.pdf' },
                deskripsi: { type: 'object' },
                pathFile: { type: 'string', example: 'materials/IN243-A-2025/meet03/slide-bab3.pdf' },
                visibility: { type: 'string', example: 'HIDE' },
            },
            },

            // ASSIGNMENTS & SUBMISSIONS 
            AssignmentListItem: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                pertemuan: { type: 'integer', example: 3 },
                judul: { type: 'string', example: 'Tugas 3 - Implementasi Array & Loop' },
                status: { type: 'string', example: 'VISIBLE' },
                statusTugas: { type: 'boolean', example: true },
                tenggat: { type: 'string', format: 'date-time' },
            },
            },
            AssignmentDetail: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                judul: { type: 'string' },
                statusTugas: { type: 'string', example: 'kelompok / individu' },
                tenggat: { type: 'string', format: 'date-time' },
                status: { type: 'string', example: 'VISIBLE' },
                deskripsi: { type: 'object' },
                lampiran: { type: 'string', nullable: true },
            },
            },
            SubmissionListItem: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                mahasiswa: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    nrp: { type: 'string' },
                    nama: { type: 'string' },
                },
                },
                submittedAt: { type: 'string', format: 'date-time' },
                file: { type: 'string' },
                grade: { type: 'number', nullable: true },
                gradeAt: { type: 'string', format: 'date-time', nullable: true },
            },
            },

            // GROUPS & THREADS 
            StudyGroupListItem: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                nama: { type: 'string' },
                kapasitas: { type: 'integer' },
                totalAnggota: { type: 'integer' },
                status: { type: 'boolean' },
                totalKontribusi: { type: 'integer' },
            },
            },
            StudyGroupDetail: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                nama: { type: 'string' },
                deskripsi: { type: 'string', nullable: true },
                kapasitas: { type: 'integer' },
                anggota: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                    id: { type: 'string' },
                    nrp: { type: 'string' },
                    nama: { type: 'string' },
                    totalKontribusi: { type: 'integer' },
                    },
                },
                },
                status: { type: 'boolean' },
                totalKontribusi: { type: 'integer' },
            },
            },
            GroupUserDetail: {
            type: 'object',
            properties: {
                id: { type: 'string', nullable: true },
                mahasiswa: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    nrp: { type: 'string' },
                    nama: { type: 'string' },
                },
                },
                kontribusi: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                    thread: { type: 'string' },
                    kontribusi: { type: 'integer' },
                    },
                },
                },
                aktivitas: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                    id: { type: 'string' },
                    aktivitas: { type: 'string' },
                    thread: {
                        type: 'object',
                        nullable: true,
                        properties: {
                        id: { type: 'string' },
                        judul: { type: 'string' },
                        },
                    },
                    createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                },
            },
            },
            ThreadListItem: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                judul: { type: 'string' },
                assignment: { type: 'string', nullable: true },
            },
            },
            PostItem: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                author: {
                type: 'object',
                properties: {
                    nrp: { type: 'string' },
                    nama: { type: 'string' },
                },
                },
                konten: { type: 'object' },
                updatedAt: { type: 'string', format: 'date-time' },
            },
            },
            TaskItem: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                task: { type: 'string' },
                mahasiswa: {
                type: 'array',
                items: { type: 'string' },
                },
                status: {
                type: 'string',
                enum: ['DO', 'IN PROGRESS', 'DONE'],
                },
            },
            },

            // APPROACH & PRIVATE FILES
            Approach: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                mahasiswa: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    nrp: { type: 'string' },
                    nama: { type: 'string' },
                },
                },
                gayaBelajar: {
                type: 'array',
                items: { type: 'string' },
                },
            },
            },
            PrivateFile: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                file: {
                type: 'object',
                properties: {
                    nama: { type: 'string' },
                    path: { type: 'string' },
                    size: { type: 'string' },
                    tipe: { type: 'string', nullable: true },
                },
                },
                status: { type: 'string', example: 'PRIVATE' },
            },
            },
        },
        },
        security: [
        {
            bearerAuth: [],
        },
        ],
    },
    apis: [path.join(__dirname, '../modules/**/*.routes.js')],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
