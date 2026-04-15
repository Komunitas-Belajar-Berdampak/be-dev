# STA Backend — Student Team Activity

Backend REST API untuk platform manajemen pembelajaran kolaboratif berbasis kelompok (Study Team Activity). Dibangun dengan **Node.js + Express + MongoDB (Mongoose)**.

---

## Daftar Isi

1. [Struktur Folder Lengkap](#1-struktur-folder-lengkap)
2. [Penjelasan Arsitektur](#2-penjelasan-arsitektur)
3. [Daftar Semua Model / Schema MongoDB](#3-daftar-semua-model--schema-mongodb)
4. [Daftar Semua Route & Endpoint](#4-daftar-semua-route--endpoint)
5. [Daftar Semua Validator (Joi Schema)](#5-daftar-semua-validator-joi-schema)
6. [Middleware Detail](#6-middleware-detail)
7. [Konfigurasi & Environment](#7-konfigurasi--environment)
8. [Seeds & Migrations](#8-seeds--migrations)
9. [Testing](#9-testing)
10. [Contoh Kode Penting](#10-contoh-kode-penting)
11. [Dependency List](#11-dependency-list)
12. [Cara Menjalankan Project](#12-cara-menjalankan-project)
13. [Alur Autentikasi & Otorisasi](#13-alur-autentikasi--otorisasi)
14. [Konvensi Respons API](#14-konvensi-respons-api)

---

## 1. Struktur Folder Lengkap

```
be-dev/
├── src/
│   ├── app.js                          # Express app setup, middleware, route mounting
│   ├── server.js                       # HTTP server + MongoDB connection + graceful shutdown
│   │
│   ├── config/
│   │   ├── index.js                    # Konfigurasi global (env, jwt, cors, s3, rateLimit)
│   │   └── mongoose.js                 # Koneksi MongoDB
│   │
│   ├── docs/
│   │   ├── openapi.yaml                # OpenAPI spec (kosong, placeholder)
│   │   └── swagger.js                  # Swagger setup & definisi komponen global
│   │
│   ├── libs/
│   │   ├── ai.js                       # Integrasi Groq AI (analisis kontribusi kelompok)
│   │   ├── cache.js                    # In-memory cache sederhana
│   │   ├── logger.js                   # Pino logger + pino-http
│   │   ├── s3.js                       # AWS SDK S3 client (Cloudflare R2)
│   │   └── storage.js                  # Helper upload/delete file ke R2
│   │
│   ├── middlewares/
│   │   ├── auth.js                     # JWT verification — attach req.user
│   │   ├── error.js                    # Global error handler
│   │   ├── performance-logger.js       # Log response time per request
│   │   ├── rbac.js                     # Role-Based Access Control
│   │   ├── upload.js                   # Multer setup untuk file upload
│   │   └── validate.js                 # Joi validation middleware
│   │
│   ├── migrations/
│   │   └── migrate-contributions.js    # Migrasi data kontribusi lama
│   │
│   ├── modules/
│   │   ├── academicTerms/
│   │   │   ├── academic-term.controller.js
│   │   │   ├── academic-term.model.js
│   │   │   ├── academic-term.routes.js
│   │   │   └── academic-term.service.js
│   │   ├── approach/
│   │   │   ├── approach.controller.js
│   │   │   ├── approach.model.js
│   │   │   ├── approach.routes.js
│   │   │   └── approach.service.js
│   │   ├── assignments/
│   │   │   ├── assignment.controller.js
│   │   │   ├── assignment.model.js
│   │   │   ├── assignment.routes.js
│   │   │   └── assignment.service.js
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.utils.js
│   │   ├── courseDashboard/
│   │   │   ├── course-dashboard.controller.js
│   │   │   ├── course-dashboard.routes.js
│   │   │   └── course-dashboard.service.js
│   │   ├── courses/
│   │   │   ├── course.controller.js
│   │   │   ├── course.model.js
│   │   │   ├── course.routes.js
│   │   │   └── course.service.js
│   │   ├── dashboard/
│   │   │   ├── dashboard.controller.js
│   │   │   ├── dashboard.routes.js
│   │   │   └── dashboard.service.js
│   │   ├── faculties/
│   │   │   ├── faculty.controller.js
│   │   │   ├── faculty.model.js
│   │   │   ├── faculty.routes.js
│   │   │   └── faculty.service.js
│   │   ├── groups/
│   │   │   ├── activity-log.model.js
│   │   │   ├── activity-log.service.js
│   │   │   ├── contribution-thread.model.js
│   │   │   ├── group-member.model.js
│   │   │   ├── group-post.model.js
│   │   │   ├── group-task.model.js
│   │   │   ├── group-thread.model.js
│   │   │   ├── group.controller.js
│   │   │   ├── group.model.js
│   │   │   ├── group.routes.js
│   │   │   ├── group.service.js
│   │   │   ├── membership.service.js
│   │   │   ├── post.service.js
│   │   │   ├── task.service.js
│   │   │   └── thread.service.js
│   │   ├── majors/
│   │   │   ├── major.controller.js
│   │   │   ├── major.model.js
│   │   │   ├── major.routes.js
│   │   │   └── major.service.js
│   │   ├── materialAccess/
│   │   │   └── material-access.model.js
│   │   ├── materials/
│   │   │   ├── material.controller.js
│   │   │   ├── material.model.js
│   │   │   ├── material.routes.js
│   │   │   └── material.service.js
│   │   ├── meetings/
│   │   │   ├── meeting.controller.js
│   │   │   ├── meeting.model.js
│   │   │   ├── meeting.routes.js
│   │   │   └── meeting.service.js
│   │   ├── privateFiles/
│   │   │   ├── private-file.controller.js
│   │   │   ├── private-file.model.js
│   │   │   ├── private-file.routes.js
│   │   │   └── private-file.service.js
│   │   ├── roles/
│   │   │   ├── roles.controller.js
│   │   │   ├── roles.model.js
│   │   │   ├── roles.routes.js
│   │   │   └── roles.service.js
│   │   ├── studentDashboard/
│   │   │   ├── student-dashboard.controller.js
│   │   │   ├── student-dashboard.routes.js
│   │   │   └── student-dashboard.service.js
│   │   ├── submissions/
│   │   │   ├── submission.controller.js
│   │   │   ├── submission.model.js
│   │   │   ├── submission.routes.js
│   │   │   └── submission.service.js
│   │   └── users/
│   │       ├── user.controller.js
│   │       ├── user.model.js
│   │       ├── user.routes.js
│   │       └── user.service.js
│   │
│   ├── seeds/
│   │   ├── seed.js                     # Seed admin user & role SUPER_ADMIN
│   │   ├── seed-course.js              # Seed 5 mata kuliah dummy
│   │   └── seed-meeting.js             # Seed 1 meeting dummy
│   │
│   ├── utils/
│   │   ├── http.js                     # ApiError class + successResponse + errorResponse
│   │   └── pagination.js               # parsePagination + buildPagination
│   │
│   ├── validators/
│   │   ├── auth/
│   │   │   ├── index.js                # Re-export loginSchema
│   │   │   └── schema.js               # Joi schema untuk login
│   │   └── users/
│   │       ├── index.js                # Re-export user schemas
│   │       └── schema.js               # Joi schemas untuk CRUD user
│   │
│   └── workers/
│       ├── analytics.worker.js         # Background worker analitik (placeholder)
│       ├── notification.worker.js      # Background worker notifikasi (placeholder)
│       └── scheduler.js               # Scheduler untuk background jobs
│
├── STA_Backend_Postman_Collection.json # Postman collection lengkap
├── STA_Backend_Postman_Environment.json # Postman environment variables
├── package.json
└── .env.example
```

---

## 2. Penjelasan Arsitektur

### Pola Request Flow

```
HTTP Request
    │
    ▼
app.js (Express)
    │
    ├── Global Middleware (helmet, cors, compression, rateLimit, mongoSanitize)
    │
    ▼
Router (*.routes.js)
    │
    ├── auth middleware          ← verifikasi JWT, inject req.user
    ├── requireRoles(...)        ← cek role user
    ├── validate(schema)         ← validasi request body via Joi
    ├── createUpload(...)        ← handle file upload via Multer
    │
    ▼
Controller (*.controller.js)
    │
    ├── Validasi tambahan (Joi langsung di controller)
    ├── Panggil service function
    │
    ▼
Service (*.service.js)
    │
    ├── Business logic
    ├── Query ke MongoDB via Mongoose model
    ├── Throw ApiError jika ada kesalahan
    │
    ▼
Model (*.model.js)          ← Mongoose schema & collection definition
    │
    ▼
MongoDB (Atlas / local)
    │
    ▼
Response via successResponse() / errorResponse()
    │
    ▼
errorHandler middleware     ← tangkap semua error dari next(err)
```

### Bagaimana Middleware Bekerja

| Middleware | Posisi | Fungsi |
|---|---|---|
| `helmet` | Global | Set security HTTP headers |
| `cors` | Global | Izinkan cross-origin dari `CORS_ORIGINS` env |
| `compression` | Global | Kompresi gzip response body |
| `express-rate-limit` | Global | Batasi request: default 100 req / 15 menit |
| `express-mongo-sanitize` | Global | Sanitasi input dari MongoDB operator injection (`$`, `.`) |
| `httpLogger` (pino-http) | Global | Log setiap request HTTP |
| `performanceLogger` | Global | Log durasi response + kategori performa |
| `auth` | Per-route | Verifikasi Bearer token JWT |
| `requireRoles(...)` | Per-route | Cek apakah `req.user.roles` memiliki role yang diizinkan |
| `validate(schema)` | Per-route | Validasi `req.body` dengan Joi schema |
| `createUpload(field)` | Per-route | Parse multipart/form-data dengan Multer |
| `errorHandler` | Global (last) | Tangkap semua `next(err)`, kembalikan respons error terstruktur |

### Bagaimana Error Handling Bekerja

Semua error dilempar sebagai `ApiError` dari layer service:

```js
// Di service:
throw new ApiError(404, 'Data tidak ditemukan');

// Di controller:
try {
    const data = await service.doSomething();
    return successResponse(res, { data });
} catch (err) {
    return next(err);   // diteruskan ke errorHandler
}

// errorHandler:
if (err instanceof ApiError) {
    return errorResponse(res, { statusCode: err.statusCode, message: err.message });
}
// Jika bukan ApiError → 500 Internal Server Error
```

Kelas `ApiError`:
- `statusCode` — HTTP status code (400, 401, 403, 404, 422, 500, dll.)
- `message` — pesan error yang ditampilkan ke client
- `details` — detail tambahan opsional (misalnya Joi validation errors)

### Bagaimana Logging Bekerja

Menggunakan **Pino** (logger tercepat untuk Node.js) + **pino-http** (log setiap HTTP request).

```
Development  → pretty-print berwarna (via pino-pretty)
Production   → JSON structured logs (untuk log aggregator)
```

Log level dikontrol via env `LOG_LEVEL` (default: `info`).

`performanceLogger` menambahkan label performa di setiap log request:
- `EXCELLENT` — < 100ms
- `GOOD` — 100–299ms
- `OK` — 300–999ms
- `SLOW` — ≥ 1000ms

---

## 3. Daftar Semua Model / Schema MongoDB

### `User` — collection: `users`

| Field | Tipe | Constraint |
|---|---|---|
| `nrp` | String | required, unique, trim |
| `nama` | String | required, trim |
| `angkatan` | String | optional |
| `idProdi` | ObjectId | ref: Major, optional |
| `email` | String | required, unique, lowercase, trim |
| `alamat` | String | optional |
| `jenisKelamin` | String | required, enum: `['pria', 'wanita']` |
| `status` | String | enum: `['aktif', 'tidak aktif']`, default: `'aktif'` |
| `passwordHash` | String | required |
| `isDefaultPassword` | Boolean | default: `true` |
| `roleIds` | [ObjectId] | ref: Role |
| `token` | String | optional |
| `fotoProfil` | String | optional (URL ke R2) |
| `createdAt` / `updatedAt` | Date | timestamps: true |

**Indexes:** `roleIds`, `idProdi`, `angkatan`, `status`, `{roleIds, status}`, `{idProdi, angkatan}`

---

### `Role` — collection: `roles`

| Field | Tipe | Constraint |
|---|---|---|
| `nama` | String | required, unique |

---

### `Faculty` — collection: `faculties`

| Field | Tipe | Constraint |
|---|---|---|
| `namaFakultas` | String | required, unique |
| `kodeFakultas` | String | optional, sparse unique |

---

### `Major` — collection: `majors`

| Field | Tipe | Constraint |
|---|---|---|
| `kodeProdi` | String | required, unique |
| `namaProdi` | String | required |
| `idFakultas` | ObjectId | ref: Faculty, required |

---

### `AcademicTerm` — collection: `academicterms`

| Field | Tipe | Constraint |
|---|---|---|
| `periode` | String | required, unique |
| `semesterType` | String | enum: `['Ganjil', 'Genap']`, optional |
| `semesters` | [Number] | array of integer |
| `startDate` | Date | optional |
| `endDate` | Date | optional |
| `status` | String | enum: `['aktif', 'tidak aktif']`, default: `'tidak aktif'` |

**Indexes:** `status`, `{startDate, endDate}`

---

### `Course` — collection: `courses`

| Field | Tipe | Constraint |
|---|---|---|
| `kodeMatkul` | String | required, unique |
| `namaMatkul` | String | required |
| `sks` | Number | required |
| `status` | String | enum: `['aktif', 'tidak aktif']`, default: `'aktif'` |
| `idPeriode` | ObjectId | ref: AcademicTerm, optional |
| `idPengajar` | [ObjectId] | ref: User |
| `idMahasiswa` | [ObjectId] | ref: User |
| `kelas` | String | optional |
| `deskripsi` | Mixed | optional (TipTap/Quill JSON object) |
| `semesterType` | String | enum: `['Ganjil', 'Genap']`, optional |

**Indexes:** `idPeriode`, `status`, `semesterType`, `{idPengajar, status}`, `{idMahasiswa, status}`, `{kodeMatkul, status}`, `{idPeriode, semesterType}`, `{idPengajar, idPeriode}`, `{idMahasiswa, idPeriode}`

---

### `Meeting` — collection: `meetings`

| Field | Tipe | Constraint |
|---|---|---|
| `idCourse` | ObjectId | ref: Course, required |
| `pertemuan` | Number | required (1–16+) |
| `judul` | String | optional |
| `deskripsi` | Mixed | optional (TipTap JSON object) |

**Indexes:** unique `{idCourse, pertemuan}`

---

### `Material` — collection: `materials`

| Field | Tipe | Constraint |
|---|---|---|
| `idMeeting` | ObjectId | ref: Meeting, required |
| `idCourse` | ObjectId | ref: Course, required |
| `pathFile` | String | optional (URL R2) |
| `namaFile` | String | optional |
| `tipe` | String | optional (MIME type) |
| `deskripsi` | String | optional |
| `status` | String | enum: `['HIDE', 'VISIBLE']`, default: `'VISIBLE'` |

**Indexes:** `{idCourse, idMeeting}`, `{idCourse, status}`

---

### `Assignment` — collection: `assignments`

| Field | Tipe | Constraint |
|---|---|---|
| `idMeeting` | ObjectId | ref: Meeting, required |
| `judul` | String | required |
| `statusTugas` | Boolean | required (true = kelompok, false = individu) |
| `tenggat` | Date | optional (deadline) |
| `status` | String | enum: `['HIDE', 'VISIBLE']`, default: `'VISIBLE'` |
| `deskripsi` | String | optional |
| `pathLampiran` | String | optional (URL R2) |

---

### `Submission` — collection: `submissions`

| Field | Tipe | Constraint |
|---|---|---|
| `idAssignment` | ObjectId | ref: Assignment, required |
| `idStudent` | ObjectId | ref: User, required |
| `submittedAt` | Date | optional |
| `file` | String | optional (URL R2) |
| `nilai` | Number | min: 0, max: 100, optional |
| `gradedAt` | Date | optional |
| `aiFlag.suspicious` | Boolean | default: false |
| `aiFlag.reason` | String | optional |

**Indexes:** partial unique `{idAssignment, idStudent}` (hanya dokumen yang tidak di-soft-delete)

---

### `StudyGroup` (Group) — collection: `studygroups`

| Field | Tipe | Constraint |
|---|---|---|
| `idCourse` | ObjectId | ref: Course, required |
| `nama` | String | optional |
| `kapasitas` | Number | required, min: 1 |
| `status` | Boolean | default: false (false = bisa request join) |
| `deskripsi` | String | optional |
| `totalKontribusi` | Number | default: 0 |

**Indexes:** unique `{idCourse, nama}`

---

### `GroupMember` — collection: `groupmembers`

| Field | Tipe | Constraint |
|---|---|---|
| `idGroup` | ObjectId | ref: StudyGroup, required |
| `idMahasiswa` | ObjectId | ref: User, required |
| `status` | String | enum: `['PENDING', 'REJECTED', 'APPROVED']`, default: `'PENDING'` |
| `kontribusi` | Number | default: 0 |

**Indexes:** unique `{idGroup, idMahasiswa}`

---

### `GroupThread` — collection: `groupthreads`

| Field | Tipe | Constraint |
|---|---|---|
| `idGroup` | ObjectId | ref: StudyGroup, required |
| `judul` | String | required |
| `idAssignment` | ObjectId | ref: Assignment, optional |
| `kontribusi` | Number | default: 0 |

**Indexes:** `idGroup`

---

### `GroupPost` — collection: `groupposts`

| Field | Tipe | Constraint |
|---|---|---|
| `idThread` | ObjectId | ref: GroupThread, required |
| `idAuthor` | ObjectId | ref: User, required |
| `konten` | Mixed | required (rich text JSON) |
| `poin` | Number | min: 0, max: 25, default: 0 |

**Indexes:** `idThread`, `idAuthor`

---

### `GroupTask` — collection: `grouptasks`

| Field | Tipe | Constraint |
|---|---|---|
| `idThread` | ObjectId | ref: GroupThread, required |
| `idMahasiswa` | [ObjectId] | ref: User |
| `task` | String | required, trim |
| `deskripsi` | String | default: null, trim |
| `status` | String | enum: `['DO', 'IN PROGRESS', 'DONE']`, default: `'DO'` |

**Indexes:** `idThread`

---

### `ActivityLog` — collection: `activitylogs`

| Field | Tipe | Constraint |
|---|---|---|
| `aktivitas` | String | required |
| `idUser` | ObjectId | ref: User, required |
| `idContribusionThread` | ObjectId | ref: ContributionThread, optional |
| `kontribusi` | Number | default: 0 |

**Indexes:** `idUser`, `idContribusionThread`

---

### `ContributionThread` — collection: `contributionthreads`

| Field | Tipe | Constraint |
|---|---|---|
| `idThread` | ObjectId | ref: GroupThread, required |
| `idMahasiswa` | ObjectId | ref: User, required |
| `kontribusi` | Number | default: 0 |

**Indexes:** unique `{idThread, idMahasiswa}`

---

### `Approach` — collection: `approaches`

| Field | Tipe | Constraint |
|---|---|---|
| `idMahasiswa` | ObjectId | ref: User, required, unique |
| `gayaBelajar` | [String] | array of learning style labels |

---

### `PrivateFile` — collection: `privatefiles`

| Field | Tipe | Constraint |
|---|---|---|
| `idMahasiswa` | ObjectId | ref: User, required |
| `namaFile` | String | required |
| `pathFile` | String | required (URL R2) |
| `size` | String | optional |
| `tipe` | String | optional (MIME type) |
| `status` | String | enum: `['VISIBLE', 'PRIVATE']`, default: `'PRIVATE'` |

---

### `MaterialAccess` — collection: `materialaccesses`

| Field | Tipe | Constraint |
|---|---|---|
| `idMahasiswa` | ObjectId | ref: User, required |
| `idMaterial` | ObjectId | ref: Material, required |
| `idCourse` | ObjectId | ref: Course, required |
| `accessedAt` | Date | default: Date.now |

**Indexes:** unique `{idMahasiswa, idMaterial}`

---

## 4. Daftar Semua Route & Endpoint

**Base URL:** `http://localhost:3000/api`

Keterangan kolom Auth:
- `JWT` = harus login (Bearer token)
- `JWT + Role` = harus login + role tertentu

---

### Authentication — `/api/auth`

| Method | Path | Auth | Role | Keterangan |
|---|---|---|---|---|
| POST | `/auth/login` | Tidak | - | Login dengan NRP & password |
| POST | `/auth/logout` | JWT | Semua | Client-side logout |
| GET | `/auth/me` | JWT | Semua | Cek token & info user saat ini |

---

### Roles — `/api/roles`

| Method | Path | Auth | Role | Keterangan |
|---|---|---|---|---|
| GET | `/roles` | JWT | SUPER_ADMIN | List semua role |
| POST | `/roles` | JWT | SUPER_ADMIN | Buat role baru |
| PUT | `/roles/:id` | JWT | SUPER_ADMIN | Update nama role |
| DELETE | `/roles/:id` | JWT | SUPER_ADMIN | Hapus role |

---

### Users — `/api/users`

| Method | Path | Auth | Role | Keterangan |
|---|---|---|---|---|
| GET | `/users` | JWT | SUPER_ADMIN | List user (filter: role, angkatan, prodi, status) |
| GET | `/users/nrp/:nrp` | JWT | Semua | Cari user berdasarkan NRP |
| GET | `/users/:id` | JWT | Semua | Detail user berdasarkan ID |
| POST | `/users` | JWT | SUPER_ADMIN | Buat user baru |
| PUT | `/users/:id` | JWT | SUPER_ADMIN | Update data user penuh |
| PATCH | `/users` | JWT | Semua | Update profil sendiri (nama, alamat, password) |
| PATCH | `/users/avatar` | JWT | Semua | Upload / ganti foto profil |

---

### Faculties — `/api/faculties`

| Method | Path | Auth | Role | Keterangan |
|---|---|---|---|---|
| GET | `/faculties` | JWT | Semua | List semua fakultas |
| POST | `/faculties` | JWT | SUPER_ADMIN | Buat fakultas |
| PUT | `/faculties/:id` | JWT | SUPER_ADMIN | Update fakultas |

---

### Majors — `/api/majors`

| Method | Path | Auth | Role | Keterangan |
|---|---|---|---|---|
| GET | `/majors` | JWT | Semua | List semua jurusan/prodi |
| POST | `/majors` | JWT | SUPER_ADMIN | Buat prodi |
| PUT | `/majors/:id` | JWT | SUPER_ADMIN | Update prodi |

---

### Academic Terms — `/api/academic-terms`

| Method | Path | Auth | Role | Keterangan |
|---|---|---|---|---|
| GET | `/academic-terms` | JWT | Semua | List semua periode akademik |
| GET | `/academic-terms/:id` | JWT | Semua | Detail periode |
| POST | `/academic-terms` | JWT | SUPER_ADMIN | Buat periode |
| PUT | `/academic-terms/:id` | JWT | SUPER_ADMIN | Update periode (penuh) |
| PATCH | `/academic-terms/:id` | JWT | SUPER_ADMIN | Update semesterType saja |
| POST | `/academic-terms/:id/semesters` | JWT | SUPER_ADMIN | Set daftar semester |
| DELETE | `/academic-terms/:id` | JWT | SUPER_ADMIN | Hapus periode |

---

### Courses — `/api/courses`

| Method | Path | Auth | Role | Keterangan |
|---|---|---|---|---|
| GET | `/courses` | JWT | Semua | List mata kuliah (difilter berdasarkan role user) |
| GET | `/courses/:id` | JWT | Semua | Detail mata kuliah |
| POST | `/courses` | JWT | SUPER_ADMIN, DOSEN | Buat mata kuliah (otomatis buat 16 meeting) |
| PUT | `/courses/:id` | JWT | SUPER_ADMIN, DOSEN | Update mata kuliah |
| PATCH | `/courses/:id` | JWT | SUPER_ADMIN, DOSEN | Update deskripsi saja |
| DELETE | `/courses/:id` | JWT | SUPER_ADMIN, DOSEN | Hapus mata kuliah |
| POST | `/courses/:id/pengajar` | JWT | SUPER_ADMIN | Tambah dosen ke mata kuliah |
| DELETE | `/courses/:id/pengajar/:dosenId` | JWT | SUPER_ADMIN | Hapus dosen dari mata kuliah |

---

### Meetings — `/api/meetings`

| Method | Path | Auth | Role | Keterangan |
|---|---|---|---|---|
| POST | `/meetings/:idCourse` | JWT | SUPER_ADMIN, DOSEN | Buat meeting baru |
| GET | `/meetings/:idCourse` | JWT | Semua | List meeting per course |
| GET | `/meetings/:pertemuan/courses/:idCourses` | JWT | Semua | Detail meeting berdasarkan nomor pertemuan |
| PUT | `/meetings/:idPertemuan` | JWT | SUPER_ADMIN, DOSEN | Update judul / deskripsi meeting |

---

### Materials — `/api/materials`

| Method | Path | Auth | Role | Keterangan |
|---|---|---|---|---|
| POST | `/materials/:idMaterial/accessed` | JWT | Semua | Catat akses materi (untuk fitur "lanjutkan belajar") |
| GET | `/materials/:idCourse/meetings/:pertemuan` | JWT | Semua | List materi per pertemuan |
| POST | `/materials/:idCourse/meetings/:pertemuan` | JWT | SUPER_ADMIN, DOSEN | Upload materi (file ke R2) |
| GET | `/materials/:idCourse` | JWT | Semua | List semua materi di course |
| GET | `/materials/:idMaterial` | JWT | Semua | Detail materi |
| PUT | `/materials/:idMaterial` | JWT | SUPER_ADMIN, DOSEN | Update materi |
| DELETE | `/materials/:idMaterial` | JWT | SUPER_ADMIN, DOSEN | Hapus materi |

---

### Assignments — `/api/assignments`

| Method | Path | Auth | Role | Keterangan |
|---|---|---|---|---|
| GET | `/assignments/:idCourse/meetings/:pertemuan` | JWT | Semua | List tugas per pertemuan |
| POST | `/assignments/:idCourse/meetings/:pertemuan` | JWT | SUPER_ADMIN, DOSEN | Buat tugas (dapat lampiran file) |
| GET | `/assignments/:idCourse` | JWT | Semua | List tugas per course |
| GET | `/assignments/:idAssignment` | JWT | Semua | Detail tugas |
| PUT | `/assignments/:idAssignment` | JWT | SUPER_ADMIN, DOSEN | Update tugas |
| DELETE | `/assignments/:idAssignment` | JWT | SUPER_ADMIN, DOSEN | Hapus tugas |

---

### Submissions — `/api/submissions`

| Method | Path | Auth | Role | Keterangan |
|---|---|---|---|---|
| GET | `/submissions/:idAssignment/summary` | JWT | DOSEN, SUPER_ADMIN | Ringkasan statistik submission |
| GET | `/submissions/:idAssignment/all` | JWT | DOSEN, SUPER_ADMIN | List semua submission + pagination |
| GET | `/submissions/:idAssignment` | JWT | MAHASISWA | Lihat submission sendiri |
| POST | `/submissions/:idAssignment` | JWT | MAHASISWA | Kumpulkan tugas (upload file) |
| PATCH | `/submissions/:idAssignment` | JWT | MAHASISWA | Edit submission yang sudah dikumpul |
| PATCH | `/submissions/assignments/:idAssignment/submissions/:idSubmission/grade` | JWT | DOSEN, SUPER_ADMIN | Beri nilai submission |

---

### Study Groups — `/api/sg`, `/api/memberships`, `/api/threads`, `/api/posts`, `/api/tasks`

**Study Groups:**

| Method | Path | Auth | Role | Keterangan |
|---|---|---|---|---|
| GET | `/sg/course/:idCourse` | JWT | Semua | List kelompok di course |
| GET | `/sg/course-membership/:idCourse` | JWT | MAHASISWA | List kelompok + status membership mahasiswa |
| GET | `/sg/group/:id` | JWT | Semua | Detail kelompok |
| GET | `/sg/:id/user-detail/:idUser` | JWT | Semua | Kontribusi mahasiswa di kelompok |
| POST | `/sg/:idCourse` | JWT | SUPER_ADMIN, DOSEN | Buat kelompok |
| PUT | `/sg/:id` | JWT | SUPER_ADMIN, DOSEN, MAHASISWA | Update kelompok |
| DELETE | `/sg/:id` | JWT | SUPER_ADMIN, DOSEN | Hapus kelompok |
| GET | `/sg/group/:idGroup/ai-contribution` | JWT | DOSEN, SUPER_ADMIN | Analisis kontribusi anggota via AI (Groq) |

**Memberships:**

| Method | Path | Auth | Role | Keterangan |
|---|---|---|---|---|
| GET | `/memberships/:idStudyGroup` | JWT | SUPER_ADMIN, DOSEN | List anggota & request membership |
| POST | `/memberships/:idStudyGroup/join` | JWT | MAHASISWA | Ajukan bergabung ke kelompok |
| POST | `/memberships/:idMembership/sg/:idStudyGroup/approve` | JWT | SUPER_ADMIN, DOSEN | Approve membership |
| POST | `/memberships/:idMembership/sg/:idStudyGroup/reject` | JWT | SUPER_ADMIN, DOSEN | Tolak membership |

**Threads & Posts:**

| Method | Path | Auth | Role | Keterangan |
|---|---|---|---|---|
| GET | `/threads/sg/:idStudyGroup` | JWT | Semua | List thread dalam kelompok |
| POST | `/threads/sg/:idStudyGroup` | JWT | Semua | Buat thread baru |
| GET | `/threads/:idThread` | JWT | Semua | List post dalam thread |
| POST | `/threads/:idThread` | JWT | Semua | Buat post dalam thread |
| GET | `/posts/:idPost` | JWT | Semua | Detail satu post |
| PUT | `/posts/:idPost` | JWT | Semua | Edit post |
| DELETE | `/posts/:idPost` | JWT | Semua | Hapus post |

**Tasks:**

| Method | Path | Auth | Role | Keterangan |
|---|---|---|---|---|
| GET | `/tasks/thread/:idThread` | JWT | Semua | List task dalam thread |
| POST | `/tasks/thread/:idThread` | JWT | MAHASISWA, SUPER_ADMIN | Buat task baru |
| PUT | `/tasks/:idTasks` | JWT | MAHASISWA, SUPER_ADMIN | Update task |
| DELETE | `/tasks/:idTasks` | JWT | MAHASISWA, SUPER_ADMIN | Hapus task |

---

### Approach — `/api/approach`

| Method | Path | Auth | Role | Keterangan |
|---|---|---|---|---|
| GET | `/approach/:idUser` | JWT | Semua | Ambil profil gaya belajar |
| POST | `/approach/:idUser` | JWT | Semua | Buat profil gaya belajar |
| PATCH | `/approach/:idUser` | JWT | Semua | Update profil gaya belajar |

---

### Private Files — `/api/private-files`

| Method | Path | Auth | Role | Keterangan |
|---|---|---|---|---|
| GET | `/private-files` | JWT | Semua | List file saya sendiri |
| POST | `/private-files` | JWT | Semua | Upload file pribadi |
| GET | `/private-files/user/:userId` | JWT | SUPER_ADMIN, DOSEN | List file milik user tertentu |
| PATCH | `/private-files/:id` | JWT | Semua | Ubah status file (VISIBLE/PRIVATE) |
| DELETE | `/private-files/:id` | JWT | Semua | Hapus file |

---

### Dashboard — `/api/dashboard`, `/api/course-dashboard`, `/api/student-dashboard`

| Method | Path | Auth | Role | Keterangan |
|---|---|---|---|---|
| GET | `/dashboard/stats` | JWT | SUPER_ADMIN | Statistik global sistem |
| GET | `/course-dashboard/:idCourse` | JWT | DOSEN, SUPER_ADMIN | Dashboard analytics course |
| GET | `/course-dashboard/:idCourse/pertemuan/:pertemuan` | JWT | DOSEN, SUPER_ADMIN | Dashboard analytics per pertemuan |
| GET | `/student-dashboard` | JWT | MAHASISWA | Dashboard mahasiswa |
| GET | `/student-dashboard/grades` | JWT | MAHASISWA | Nilai submission milik sendiri |
| GET | `/student-dashboard/grades/:idStudent` | JWT | DOSEN, SUPER_ADMIN | Nilai submission mahasiswa tertentu |

---

### Utility

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/health` | Tidak | Health check server |
| GET | `/docs` | Tidak | Swagger UI |

---

## 5. Daftar Semua Validator (Joi Schema)

### `src/validators/auth/schema.js` — Auth

```js
loginSchema: {
    nrp: string, required
    password: string, required
}
```

---

### `src/validators/users/schema.js` — Users

```js
createUserSchema: {
    nrp: string, required
    idRole: string (ObjectId), required
    idProdi: string (ObjectId), optional
    nama: string, required
    angkatan: string, optional
    email: string email, required
    alamat: string, optional
    jenisKelamin: enum ['pria', 'wanita'], required
    status: enum ['aktif', 'tidak aktif'], optional
    password: string min 6, required
    fotoProfil: string, optional
}

updateUserSchema: {
    // sama dengan createUserSchema tapi semua optional, min 1 field
}

patchUserSchema: {
    passwordLama: string, optional
    passwordBaru: string min 6, optional
    nama: string, optional
    alamat: string, optional
    fotoProfil: string allow null, optional
}
```

---

### Validator di dalam Controller — Academic Terms

```js
createTermSchema: {
    periode: string, required
    semesterType: enum ['Ganjil', 'Genap'], optional
    startDate: date, optional
    endDate: date, optional
    status: enum ['aktif', 'tidak aktif'], optional
}

updateTermSchema: {
    // semua field optional, min 1
}

patchTermSemesterSchema: {
    semesterType: enum ['Ganjil', 'Genap'], required
}

addSemestersSchema: {
    semesters: array of integer, min 1, required
}
```

---

### Validator di dalam Controller — Courses

```js
createCourseSchema: {
    kodeMatkul: string, required
    namaMatkul: string, required
    sks: number integer, required
    status: enum ['aktif', 'tidak aktif'], optional
    idPeriode: string (ObjectId), optional
    idMahasiswa: array of string, optional
    kelas: string, optional
    semesterType: enum ['Ganjil', 'Genap'], optional
}

updateCourseSchema: {
    // semua optional, min 1 field
}

patchDeskripsiSchema: {
    deskripsi: object, required
}

addPengajarSchema: {
    idPengajar: array of string min 1, required
}
```

---

### Validator di dalam Controller — Faculties

```js
createFacultySchema: {
    namaFakultas: string, required
    kodeFakultas: string, optional
}

updateFacultySchema: {
    namaFakultas: string, optional
    kodeFakultas: string, optional
    // min 1 field
}
```

---

### Validator di dalam Controller — Majors

```js
createSchema: {
    kodeProdi: string, required
    namaProdi: string, required
    idFakultas: string (ObjectId), required
}

updateSchema: {
    // semua optional, min 1 field
}
```

---

### Validator di dalam Controller — Groups (Study Groups)

```js
createGroupSchema: {
    nama: string, optional
    deskripsi: string allow null, optional
    idMahasiswa: array of string, optional
    status: boolean, optional
    kapasitas: number integer min 1, required
}

updateGroupSchema: {
    // semua optional, min 1 field
}

createThreadSchema: {
    judul: string, required
    idAssignment: string, optional
}

createPostSchema: {
    konten: object, required
}

updatePostSchema: {
    konten: object, required
}

createTaskSchema: {
    task: string, required
    deskripsi: string allow null, optional
    idMahasiswa: array of string, required
    status: enum ['DO', 'IN PROGRESS', 'DONE'], required
}

updateTaskSchema: {
    task: string, optional
    deskripsi: string allow null, optional
    idMahasiswa: array of string, optional
    status: enum ['DO', 'IN PROGRESS', 'DONE'], optional
    // min 1 field
}
```

---

## 6. Middleware Detail

### `src/middlewares/auth.js`

**Fungsi:** Verifikasi JWT Bearer token dari header `Authorization`.

**Cara kerja:**
1. Ambil header `Authorization`
2. Ekstrak token setelah prefix `Bearer `
3. Verifikasi dengan `jwt.verify(token, config.jwt.secret)`
4. Jika valid → inject `req.user = payload` (berisi: `sub`, `nrp`, `nama`, `roles`)
5. Jika tidak ada token → `ApiError(401, 'Token tidak ditemukan')`
6. Jika token invalid/expired → `ApiError(401, 'Token tidak valid')`

**Contoh penggunaan:**
```js
router.get('/me', auth, controller.getMe);
router.use(auth); // terapkan ke semua route dalam router
```

---

### `src/middlewares/rbac.js`

**Fungsi:** Role-Based Access Control — pastikan user memiliki role yang diperlukan.

**Cara kerja:**
1. Terima list role yang diizinkan sebagai argumen: `requireRoles('DOSEN', 'SUPER_ADMIN')`
2. Cek `req.user.roles` (array nama role)
3. Jika user memiliki minimal satu role yang cocok → `next()`
4. Jika tidak → `ApiError(403, 'Anda tidak boleh mengakses resource ini')`

**Contoh penggunaan:**
```js
router.post('/sg/:idCourse', requireRoles('SUPER_ADMIN', 'DOSEN'), controller.createGroup);
router.get('/dashboard/stats', requireRoles('SUPER_ADMIN'), controller.getStats);
```

---

### `src/middlewares/validate.js`

**Fungsi:** Validasi `req.body` menggunakan Joi schema.

**Cara kerja:**
1. Jalankan `schema.validate(req.body, { abortEarly: false })`
2. Jika error → teruskan ke error handler dengan detail validasi
3. Jika valid → `req.body = value` (nilai yang sudah di-strip/cast oleh Joi), lanjut ke next

**Contoh penggunaan:**
```js
router.post('/login', validate(loginSchema), controller.login);
router.post('/', validate(createTermSchema), controller.createTerm);
```

---

### `src/middlewares/upload.js`

**Fungsi:** Handle file upload dengan Multer (in-memory storage, kemudian upload ke Cloudflare R2).

**Cara kerja:**
1. Konfigurasi Multer dengan `memoryStorage()` (file disimpan di memory Buffer)
2. Ekspor `createUpload(fieldName, options)` factory
3. File tersedia di `req.file` setelah middleware berjalan
4. Selanjutnya controller / service upload file ke R2 via `src/libs/storage.js`

**Contoh penggunaan:**
```js
router.post('/:idMaterial', createUpload('file', { required: true }), controller.createMaterial);
router.patch('/avatar', createUpload('avatar', { required: false }), controller.updateAvatar);
```

---

### `src/middlewares/error.js`

**Fungsi:** Tangkap semua error yang di-`next(err)` dan kembalikan respons error terstruktur.

**Cara kerja:**
1. Cek apakah response sudah dikirim (`res.headersSent`) → jika ya, end response
2. Jika error adalah `ApiError` → kembalikan `statusCode` + `message` dari error
3. Jika error lain (bug/crash) → log error + kembalikan 500

**Posisi di app.js:** Harus di-register SETELAH semua routes.

---

### `src/middlewares/performance-logger.js`

**Fungsi:** Log response time setiap request dengan kategori performa.

**Cara kerja:** Dengarkan event `res.on('finish')`, hitung selisih waktu dari awal request, log ke Pino dengan label `EXCELLENT/GOOD/OK/SLOW`.

---

## 7. Konfigurasi & Environment

Buat file `.env` di root project. Contoh isi lengkap:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/sta-db

# JWT
JWT_SECRET=your-very-strong-secret-minimum-32-characters
JWT_EXPIRES_IN=8h

# CORS (pisahkan dengan koma)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Rate Limiting
RATE_WINDOW_MS=900000   # 15 menit dalam milidetik
RATE_MAX=100            # maksimum request per window

# Base URL (untuk generate public URL)
BASE_URL=http://localhost:3000

# Cloudflare R2 (S3-compatible storage)
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET=your-bucket-name
R2_PUBLIC_URL=https://pub-xxxx.r2.dev

# Groq AI (opsional, untuk fitur analisis kontribusi)
GROQ_API_KEY=your-groq-api-key

# Logging
LOG_LEVEL=info
```

### Penjelasan Konfigurasi

| Variabel | Wajib | Keterangan |
|---|---|---|
| `MONGO_URI` | Ya | Connection string MongoDB Atlas |
| `JWT_SECRET` | Ya | Secret key JWT, minimum 32 karakter |
| `JWT_EXPIRES_IN` | Tidak | Masa berlaku token, default `8h` |
| `CORS_ORIGINS` | Tidak | Daftar origin yang diizinkan, default `http://localhost:3000` |
| `RATE_WINDOW_MS` | Tidak | Jendela waktu rate limit, default 15 menit |
| `RATE_MAX` | Tidak | Maks request per window, default 100 |
| `R2_*` | Tidak* | Diperlukan untuk fitur upload file |
| `GROQ_API_KEY` | Tidak | Diperlukan untuk fitur AI contribution analysis |

---

## 8. Seeds & Migrations

### Seeds

Jalankan seed untuk setup awal:

```bash
# 1. Seed SUPER_ADMIN user dan role
npm run seed

# 2. Seed 5 mata kuliah dummy
npm run seed:course

# 3. Seed 1 meeting dummy untuk course pertama
npm run seed:meeting
```

#### `src/seeds/seed.js`

Membuat:
- Role `SUPER_ADMIN` (jika belum ada)
- User admin dengan kredensial:
  - NRP: `Admin`
  - Password: `password123`
  - Email: `admin@kampus.ac.id`
  - Jenis Kelamin: `pria`

#### `src/seeds/seed-course.js`

Membuat 5 mata kuliah dummy (membutuhkan `idPeriode` aktif):

| Kode | Nama | SKS | Kelas |
|---|---|---|---|
| IF101 | Algoritma dan Pemrograman | 3 | A |
| IF102 | Struktur Data | 3 | A |
| IF103 | Basis Data | 3 | B |
| IF104 | Rekayasa Perangkat Lunak | 3 | A |
| IF105 | Jaringan Komputer | 2 | B |

#### `src/seeds/seed-meeting.js`

Membuat meeting pertemuan ke-1 untuk course pertama yang ditemukan di database.

---

### Migrations

#### `src/migrations/migrate-contributions.js`

Migrasi data kontribusi lama ke format `ContributionThread` baru. Jalankan dengan:

```bash
npm run migrate:contributions
```

---

## 9. Testing

### Test Runner

Project menggunakan **Jest** + **Supertest** untuk integration testing.

```bash
# Jalankan semua test
npm test

# Jalankan test dengan watch mode
npm test -- --watch

# Jalankan test spesifik
npm test -- --testPathPattern=auth
```

### Postman Collection

File Postman tersedia di root project:

- `STA_Backend_Postman_Collection.json` — 22 folder, 90+ request
- `STA_Backend_Postman_Environment.json` — environment variables

**Environment Variables Postman:**

| Variable | Keterangan |
|---|---|
| `base_url` | URL server, default `http://localhost:3000` |
| `token` | JWT token (otomatis terisi setelah login) |
| `user_id` | ID user untuk test |
| `course_id` | ID mata kuliah |
| `group_id` | ID study group |
| `assignment_id` | ID tugas |
| `thread_id` | ID thread kelompok |
| `task_id` | ID task (otomatis terisi setelah create task) |
| `meeting_id` | ID pertemuan |
| `faculty_id` | ID fakultas |
| `major_id` | ID jurusan |
| `role_id` | ID role |

**Alur pengujian yang disarankan:**
1. Jalankan **Login as Admin** → token otomatis tersimpan
2. Tes endpoint SUPER_ADMIN (roles, users, courses, dll.)
3. Jalankan **Login as Teacher** → token diganti ke token dosen
4. Tes endpoint DOSEN
5. Jalankan **Login as Student** → token diganti ke token mahasiswa
6. Tes endpoint MAHASISWA

---

## 10. Contoh Kode Penting

### `src/server.js` — Entry Point

```js
const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config');
const { logger } = require('./libs/logger');
const { connectDB } = require('./config/mongoose');

require('./modules/majors/major.model');

const server = http.createServer(app);

const start = async () => {
    try {
        await connectDB();
        server.listen(config.port, () => {
            logger.info({ port: config.port }, 'Server listening');
        });
    } catch (err) {
        logger.error({ err }, 'Failed to start server');
        process.exit(1);
    }
};

start();

process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down');
    server.close(async () => {
        await mongoose.connection.close();
        process.exit(0);
    });
});

process.on('unhandledRejection', (err) => {
    logger.error({ err }, 'Unhandled promise rejection');
});
```

---

### `src/app.js` — Express Application

```js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const config = require('./config');

const { httpLogger } = require('./libs/logger');
const errorHandler = require('./middlewares/error');
const performanceLogger = require('./middlewares/performance-logger');

const authRoutes = require('./modules/auth/auth.routes');
const rolesRoutes = require('./modules/roles/roles.routes');
const userRoutes = require('./modules/users/user.routes');
const academicTermRoutes = require('./modules/academicTerms/academic-term.routes');
const facultyRoutes = require('./modules/faculties/faculty.routes');
const majorRoutes = require('./modules/majors/major.routes');
const courseRoutes = require('./modules/courses/course.routes');
const meetingRoutes = require('./modules/meetings/meeting.routes');
const materialRoutes = require('./modules/materials/material.routes');
const assignmentRoutes = require('./modules/assignments/assignment.routes');
const submissionRoutes = require('./modules/submissions/submission.routes');
const groupRoutes = require('./modules/groups/group.routes');
const approachRoutes = require('./modules/approach/approach.routes');
const privateFileRoutes = require('./modules/privateFiles/private-file.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const courseDashboardRoutes = require('./modules/courseDashboard/course-dashboard.routes');
const studentDashboardRoutes = require('./modules/studentDashboard/student-dashboard.routes');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');

const app = express();

app.use(httpLogger);
app.use(performanceLogger);
app.use(helmet());
app.use(cors({ origin: config.cors.origins }));
app.use(compression());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
}));

app.get('/health', (req, res) => {
    res.json({ status: 'success', message: 'STA backend running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/users', userRoutes);
app.use('/api/academic-terms', academicTermRoutes);
app.use('/api/faculties', facultyRoutes);
app.use('/api/majors', majorRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api', groupRoutes);
app.use('/api/approach', approachRoutes);
app.use('/api/private-files', privateFileRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/course-dashboard', courseDashboardRoutes);
app.use('/api/student-dashboard', studentDashboardRoutes);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use((req, res) => {
    res.status(404).json({ status: 'error', message: 'Not Found' });
});
app.use(errorHandler);

module.exports = app;
```

---

### `src/config/index.js` — Konfigurasi Global

```js
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
    process.exit(1);
}

if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET must be at least 32 characters long for security');
    process.exit(1);
}

const config = {
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT) || 3000,
    mongoUri: process.env.MONGO_URI,
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    },
    cors: {
        origins: (process.env.CORS_ORIGINS || 'http://localhost:3000')
            .split(',').map((o) => o.trim()).filter(Boolean),
    },
    rateLimit: {
        windowMs: Number(process.env.RATE_WINDOW_MS) || 15 * 60 * 1000,
        max: Number(process.env.RATE_MAX) || 100,
    },
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    s3: {
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        bucket: process.env.R2_BUCKET,
        publicUrl: process.env.R2_PUBLIC_URL,
    },
};

module.exports = config;
```

---

### Contoh Fitur Lengkap: Authentication

#### `src/validators/auth/schema.js`

```js
const Joi = require('joi');

const loginSchema = Joi.object({
    nrp: Joi.string().required(),
    password: Joi.string().required(),
});

module.exports = { loginSchema };
```

#### `src/modules/auth/auth.routes.js`

```js
const express = require('express');
const { loginSchema } = require('../../validators/auth');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const controller = require('./auth.controller');

const router = express.Router();

router.post('/login', validate(loginSchema), controller.login);
router.post('/logout', auth, controller.logout);
router.get('/me', auth, controller.getMe);

module.exports = router;
```

#### `src/modules/auth/auth.controller.js`

```js
const { successResponse } = require('../../utils/http');
const authService = require('./auth.service');

const login = async (req, res, next) => {
    try {
        const { nrp, password } = req.body;
        const result = await authService.login(nrp, password);
        return successResponse(res, { message: 'login berhasil!', data: result });
    } catch (err) {
        return next(err);
    }
};

const logout = async (req, res, next) => {
    try {
        return successResponse(res, { message: 'logged out berhasil!' });
    } catch (err) {
        return next(err);
    }
};

const getMe = async (req, res, next) => {
    try {
        return successResponse(res, {
            message: 'user terverifikasi!',
            user: {
                nrp: req.user.nrp,
                nama: req.user.nama,
                namaRole: req.user.roles.join(','),
            },
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = { login, logout, getMe };
```

#### `src/modules/auth/auth.service.js`

```js
const User = require('../users/user.model');
const { ApiError } = require('../../utils/http');
const { comparePassword, signAccessToken } = require('./auth.utils');

const login = async (nrp, password) => {
    const user = await User.findOne({ nrp }).populate('roleIds').lean();
    if (!user) throw new ApiError(401, 'NRP atau password salah');

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) throw new ApiError(401, 'NRP atau password salah');

    const roleNames = (user.roleIds || []).map((r) => r.nama);
    const token = signAccessToken({
        sub: user._id.toString(),
        nrp: user.nrp,
        nama: user.nama,
        roles: roleNames,
    });

    return {
        token,
        user: {
            id: user._id,
            nrp: user.nrp,
            nama: user.nama,
            namaRole: roleNames.join(','),
            isDefaultPassword: user.isDefaultPassword ?? true,
        },
    };
};

module.exports = { login };
```

#### `src/modules/auth/auth.utils.js`

```js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../../config');

const hashPassword = async (plain) => bcrypt.hash(plain, 10);
const comparePassword = async (plain, hash) => bcrypt.compare(plain, hash);
const signAccessToken = (payload) =>
    jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

module.exports = { hashPassword, comparePassword, signAccessToken };
```

---

### Middleware Auth & RBAC

#### `src/middlewares/auth.js`

```js
const jwt = require('jsonwebtoken');
const config = require('../config');
const { ApiError } = require('../utils/http');

const auth = (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) return next(new ApiError(401, 'Token tidak ditemukan'));

    try {
        const payload = jwt.verify(token, config.jwt.secret);
        req.user = payload;
        return next();
    } catch (err) {
        return next(new ApiError(401, 'Token tidak valid'));
    }
};

module.exports = auth;
```

#### `src/middlewares/rbac.js`

```js
const { ApiError } = require('../utils/http');

const requireRoles = (...allowedRoles) => (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Token tidak ditemukan'));
    if (!allowedRoles.length) return next();

    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [];
    const ok = allowedRoles.some((role) => userRoles.includes(role));

    if (!ok) return next(new ApiError(403, 'Anda tidak boleh mengakses resource ini'));
    return next();
};

module.exports = requireRoles;
```

---

### Error Handler

#### `src/middlewares/error.js`

```js
const { ApiError, errorResponse } = require('../utils/http');
const { logger } = require('../libs/logger');

const errorHandler = (err, req, res, next) => {
    if (res.headersSent) return res.end();

    if (err instanceof ApiError) {
        return errorResponse(res, {
            statusCode: err.statusCode,
            message: err.message,
            details: err.details,
        });
    }

    logger.error({ err }, 'Unhandled error');
    return errorResponse(res, { statusCode: 500, message: 'Internal server error' });
};

module.exports = errorHandler;
```

---

### Contoh Fitur Kompleks: Study Groups

Modul **Study Groups** adalah fitur terkompleks, mencakup manajemen kelompok, membership, thread diskusi, post, dan task — semuanya terintegrasi dalam satu `group.routes.js` dan `group.controller.js`.

**Alur lengkap fitur Study Group:**

```
Dosen/Admin                     Mahasiswa
    │                               │
    ▼                               │
POST /sg/:idCourse                  │
(buat kelompok)                     │
    │                               │
    │                               ▼
    │                   POST /memberships/:idStudyGroup/join
    │                   (ajukan bergabung)
    │                               │
    ▼                               │
POST /memberships/:id/sg/:id/approve ◄──────┘
(approve mahasiswa)
    │
    ▼
POST /threads/sg/:idStudyGroup
(buat thread diskusi)
    │
    ├──► POST /threads/:idThread (buat post) ◄── Mahasiswa
    │
    └──► POST /tasks/thread/:idThread ◄── Mahasiswa
         (buat task: DO → IN PROGRESS → DONE)
              │
              ▼
    GET /sg/group/:idGroup/ai-contribution
    (analisis kontribusi dengan Groq AI)
```

**Model yang terlibat:**
- `StudyGroup` — data kelompok (nama, kapasitas, status)
- `GroupMember` — membership dengan status PENDING/APPROVED/REJECTED + poin kontribusi
- `GroupThread` — thread diskusi dalam kelompok
- `GroupPost` — post/komentar dalam thread (mengakumulasi poin)
- `GroupTask` — task dalam thread (DO/IN PROGRESS/DONE)
- `ActivityLog` — log setiap aktivitas anggota
- `ContributionThread` — tracking kontribusi per mahasiswa per thread

---

## 11. Dependency List

### Production Dependencies

| Package | Versi | Fungsi |
|---|---|---|
| `express` | ^4.19.2 | Framework web HTTP utama |
| `mongoose` | ^8.14.1 | ODM untuk MongoDB, definisi schema dan query |
| `jsonwebtoken` | ^9.0.2 | Generate dan verifikasi JWT token |
| `bcrypt` | ^5.1.1 | Hash dan compare password |
| `joi` | ^17.13.3 | Validasi schema request body |
| `multer` | ^2.1.1 | Middleware untuk multipart/form-data (file upload) |
| `dotenv` | ^16.5.0 | Load environment variables dari file `.env` |
| `cors` | ^2.8.5 | Middleware CORS (Cross-Origin Resource Sharing) |
| `helmet` | ^7.1.0 | Set security HTTP headers (XSS, clickjacking, dll.) |
| `compression` | ^1.7.4 | Kompresi gzip response untuk performa |
| `express-rate-limit` | ^7.4.0 | Batasi jumlah request per IP (rate limiting) |
| `express-mongo-sanitize` | ^2.2.0 | Sanitasi input dari MongoDB operator injection |
| `pino` | ^9.4.0 | Logger JSON performa tinggi |
| `pino-http` | ^9.0.0 | Pino middleware untuk log setiap HTTP request |
| `@aws-sdk/client-s3` | ^3.664.0 | AWS SDK untuk operasi S3 (digunakan untuk Cloudflare R2) |
| `@aws-sdk/s3-request-presigner` | ^3.664.0 | Generate presigned URL untuk akses S3 |
| `groq-sdk` | ^1.1.2 | Client SDK untuk Groq AI API (analisis kontribusi kelompok) |
| `swagger-jsdoc` | ^6.2.8 | Generate OpenAPI spec dari JSDoc comment |
| `swagger-ui-express` | ^5.0.1 | Serve Swagger UI dari spec JSON |
| `dayjs` | ^1.11.13 | Library tanggal ringan (pengganti Moment.js) |
| `nanoid` | ^5.1.5 | Generate unique ID ringkas dan aman |

### Dev Dependencies

| Package | Versi | Fungsi |
|---|---|---|
| `nodemon` | ^3.1.10 | Auto-restart server saat ada perubahan file (development) |
| `jest` | ^29.7.0 | Test runner untuk unit & integration testing |
| `supertest` | ^7.0.0 | HTTP assertion library untuk testing Express app |
| `pino-pretty` | ^13.1.2 | Format output Pino menjadi teks berwarna (development) |
| `eslint` | ^9.26.0 | Linter JavaScript untuk deteksi bug dan style consistency |
| `prettier` | ^3.5.3 | Code formatter otomatis |
| `cross-env` | ^7.0.3 | Set environment variables lintas OS (Windows/macOS/Linux) |

---

## 12. Cara Menjalankan Project

### Prasyarat

- Node.js >= 18
- MongoDB Atlas (atau instance lokal)
- (Opsional) Cloudflare R2 bucket untuk file upload

### Langkah Instalasi

```bash
# 1. Clone repository
git clone <repo-url>
cd be-dev

# 2. Install dependencies
npm install

# 3. Buat file .env dari template
cp .env.example .env
# Edit .env dan isi MONGO_URI, JWT_SECRET, dll.

# 4. Jalankan seed awal
npm run seed

# 5. Jalankan server
npm run dev          # development (nodemon, auto-restart)
npm start            # production
```

### Scripts Tersedia

| Script | Perintah | Keterangan |
|---|---|---|
| `npm start` | `node src/server.js` | Jalankan server production |
| `npm run dev` | `nodemon src/server.js` | Jalankan server development |
| `npm test` | `jest --runInBand` | Jalankan semua test |
| `npm run lint` | `eslint .` | Cek code style |
| `npm run format` | `prettier -w .` | Format semua file |
| `npm run seed` | `node src/seeds/seed.js` | Seed admin user |
| `npm run seed:course` | `node src/seeds/seed-course.js` | Seed mata kuliah dummy |
| `npm run seed:meeting` | `node src/seeds/seed-meeting.js` | Seed meeting dummy |
| `npm run migrate:contributions` | `node src/migrations/migrate-contributions.js` | Migrasi data kontribusi |

### Akun Default Setelah Seed

| Role | NRP | Password |
|---|---|---|
| SUPER_ADMIN | `Admin` | `password123` |

---

## 13. Alur Autentikasi & Otorisasi

```
Client                        Server
  │                              │
  │  POST /api/auth/login        │
  │  { nrp, password }  ────────►│
  │                              │ 1. Cari user by NRP
  │                              │ 2. Compare bcrypt hash
  │                              │ 3. Generate JWT
  │                              │    payload: { sub, nrp, nama, roles[] }
  │◄──────────────────────────── │
  │  { token, user }             │
  │                              │
  │  GET /api/courses            │
  │  Authorization: Bearer <tok> │
  │  ───────────────────────────►│
  │                              │ auth middleware:
  │                              │   jwt.verify(token) → req.user
  │                              │
  │                              │ requireRoles('DOSEN'):
  │                              │   req.user.roles.includes('DOSEN')?
  │                              │   → Ya: next()
  │                              │   → Tidak: 403 Forbidden
  │◄──────────────────────────── │
  │  200 OK { data: [...] }      │
```

**JWT Payload Structure:**

```json
{
  "sub": "64a1b2c3d4e5f6a7b8c9d0e1",
  "nrp": "2272001",
  "nama": "Budi Santoso",
  "roles": ["MAHASISWA"],
  "iat": 1716825600,
  "exp": 1716854400
}
```

---

## 14. Konvensi Respons API

### Sukses

```json
{
  "status": "success",
  "message": "data berhasil diambil!",
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total_items": 50,
    "total_pages": 5
  }
}
```

### Error

```json
{
  "status": "error",
  "message": "Data tidak ditemukan",
  "details": { ... }
}
```

### HTTP Status Code yang Digunakan

| Code | Kondisi |
|---|---|
| `200` | OK — request berhasil |
| `201` | Created — data berhasil dibuat |
| `400` | Bad Request — input tidak valid |
| `401` | Unauthorized — token tidak ada / tidak valid |
| `403` | Forbidden — tidak punya role yang diperlukan |
| `404` | Not Found — data tidak ditemukan |
| `422` | Unprocessable Entity — kondisi bisnis tidak terpenuhi |
| `500` | Internal Server Error — bug / unhandled exception |

---
