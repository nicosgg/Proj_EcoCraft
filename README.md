# EcoCraft: Web Client + REST API

Proyek PBAD (Pengembangan Aplikasi Berbasis Platform). EcoCraft adalah platform *social learning* untuk *upcycling*: anggota mempelajari tutorial, mengunggah bukti hasil karya, saling memberi Eco-Kudos untuk verifikasi, lalu menukar Eco-Coins dengan reward.

Repositori ini berisi tahap UTS: **satu server REST API (Node.js) dengan satu database**, dan **Web Client (React + TypeScript)** yang terhubung dua arah ke API tersebut. Klien Mobile (React Native) dan Desktop (C# WinForms) nantinya memakai API yang sama.

```
   Web (React TS)      Mobile (React Native)      Desktop (C# WinForms)
          \                     |                          /
           \_____________ HTTP + JSON (REST) _____________/
                                |
                  Server Node.js (Express)  :3000
                                |
                  Database SQLite (server/database.sqlite)
```

| Bagian | Teknologi |
|---|---|
| API | Node.js, Express 4, SQLite (`sqlite3`), JWT (`jsonwebtoken`), `bcryptjs`, `multer` (unggah foto), `cors` |
| Web | React 18, TypeScript, Vite, React Router, Axios, `lucide-react` (ikon) |
| Database | **Satu** file SQLite: `server/database.sqlite` (dibuat otomatis) |

## Struktur folder

```
ecocraft-pbad/
├── server/                     REST API terpusat
│   ├── server.js               titik masuk (npm run dev)
│   ├── src/
│   │   ├── app.js              konfigurasi Express, middleware, static
│   │   ├── config/             env, koneksi + skema database, aturan bisnis
│   │   ├── routes/             satu file per resource (URL -> controller)
│   │   ├── controllers/        validasi request dan logika endpoint
│   │   ├── models/             query SQL ke SQLite
│   │   ├── middleware/         auth JWT, unggah foto, penanganan error
│   │   ├── db/seed.js          data awal (npm run seed)
│   │   └── docs/endpoints.js   daftar endpoint untuk GET /api
│   ├── public/illustrations/   gambar bawaan tutorial
│   ├── uploads/                foto yang diunggah pengguna
│   └── tests/api.test.js       pengujian otomatis semua endpoint
├── web/                        Web Client
│   └── src/
│       ├── api/axiosClient.ts  instance Axios + token JWT otomatis
│       ├── api/endpoints.ts    SEMUA pemanggilan endpoint, per resource
│       ├── types/data_type.ts  interface TypeScript untuk JSON dari API
│       ├── context/            AuthContext (login global), ToastContext
│       ├── components/         Navbar, ProtectedRoute, kartu, modal, dll.
│       └── pages/              halaman (Jelajah, Komunitas, Profil, Admin, API)
└── docs/
    ├── API.md                              tabel dokumentasi endpoint lengkap
    └── EcoCraft-API.postman_collection.json koleksi Postman
```

## Menjalankan

Prasyarat: **Node.js 18 atau lebih baru**.

**Terminal 1: API**

```bash
cd server
npm install
cp .env.example .env        # Windows: copy .env.example .env
npm run dev                 # http://localhost:3000
```

Saat pertama kali menyala, server membuat `database.sqlite` dan mengisi data awal. Untuk mengosongkan dan mengisi ulang data: `npm run seed`.

**Terminal 2: Web**

```bash
cd web
npm install
cp .env.example .env        # isi: VITE_API_BASE_URL=http://localhost:3000
npm run dev                 # http://localhost:5173
```

### Akun contoh

| Peran | Email | Kata sandi |
|---|---|---|
| Admin | `admin@ecocraft.id` | `admin123` |
| Anggota | `sarah@ecocraft.id` (saldo 350 koin) | `eco12345` |
| Anggota lain | `rizky@`, `dimas@`, `anisa@`, `maya@`, `joko@`, `rina@`, `dewi@ecocraft.id`, dst. | `eco12345` |

Untuk mencoba verifikasi: login sebagai Sarah, unggah aksi, lalu login bergantian sebagai lima anggota lain dan beri Eco-Kudos. Pada kudos ke-5 aksi menjadi terverifikasi dan koin Sarah bertambah.

## Endpoint

Ada **34 endpoint**. Daftarnya bisa dilihat dengan tiga cara:

1. **`docs/API.md`**: tabel Method, Endpoint, Akses, Request, Response, ditambah contoh JSON asli setiap endpoint, kode status, aturan bisnis, dan model data.
2. **`GET http://localhost:3000/api`**: daftar endpoint langsung dari server, atau halaman **API** di Web Client (`/api-docs`).
3. **Postman**: impor `docs/EcoCraft-API.postman_collection.json`. Jalankan request *Login* dulu; token otomatis tersimpan di variabel `{{token}}`.

| Resource | Endpoint |
|---|---|
| Autentikasi | `POST /api/auth/register`, `POST /api/auth/login` |
| Profil | `GET /api/me`, `GET /api/me/actions`, `GET /api/me/redemptions` |
| Tutorial | `GET/POST /api/tutorials`, `GET/PUT/DELETE /api/tutorials/:id` |
| Aksi | `GET/POST /api/actions`, `GET/PATCH/DELETE /api/actions/:id`, `POST/DELETE /api/actions/:id/kudos`, `PATCH /api/actions/:id/status` |
| Unggah foto | `POST /api/uploads` (form-data, field `image`) |
| Titik setor | `GET/POST /api/drop-points`, `GET/PUT/DELETE /api/drop-points/:id` |
| Reward | `GET/POST /api/rewards`, `GET/PUT/DELETE /api/rewards/:id`, `POST /api/rewards/:id/redeem` |
| Umum | `GET /`, `GET /api`, `GET /api/materials`, `GET /api/stats` |

Semua respons sukses berbentuk `{ "message": ..., "data": ... }`, semua error `{ "message": ..., "errors"?: {...} }`.

## Menghubungkan Mobile dan Desktop

- **Base URL:** jangan pakai `localhost` dari HP. Pakai alamat yang dicetak server saat menyala, misalnya `http://192.168.1.10:3000`. Emulator Android memakai `http://10.0.2.2:3000`. HP dan laptop harus satu jaringan Wi-Fi.
- **Login:** `POST /api/auth/login`, simpan `data.token`, lalu kirim header `Authorization: Bearer <token>` pada endpoint yang wajib login.
- **Unggah foto:** `POST /api/uploads` dengan `multipart/form-data` (field `image`), lalu kirim `data.url` sebagai `imageUrl` ke `POST /api/actions`.
- **Gambar:** field `imageUrl` dari API sudah berupa URL lengkap sesuai host yang dipanggil, jadi bisa langsung ditampilkan.
- **Desktop untuk admin:** endpoint admin (CRUD tutorial, titik setor, reward, moderasi aksi) cocok untuk aplikasi WinForms.

## Pengujian

```bash
cd server
npm test          # 7 kelompok uji: semua endpoint, validasi, hak akses, alur kudos -> koin, penukaran
```

Pengujian memakai database sementara, sehingga `database.sqlite` tidak berubah.

## Pemetaan ke rubrik UTS

| Rubrik | Di mana |
|---|---|
| Fetching JSON | `web/src/api/endpoints.ts` (Axios), dipakai di semua halaman `web/src/pages/` |
| Manipulasi state React | Pola Data, Loading, Error dengan `useState` + `useEffect` di tiap halaman; state global login di `context/AuthContext.tsx` |
| Form POST | `ActionFormPage.tsx` (POST/PATCH aksi + unggah foto), `TutorialFormPage.tsx` (POST/PUT), form titik setor di `DropPointsPage.tsx`, `LoginPage`/`RegisterPage` |
| CRUD | Tutorial dan titik setor (admin), aksi (anggota), Eco-Kudos (POST/DELETE) |
| Dokumentasi API | `docs/API.md`, `GET /api`, koleksi Postman |

## Catatan

- Nama dan lokasi titik setor serta kode voucher adalah data contoh.
- Ganti `JWT_SECRET` di `server/.env` sebelum dipakai di luar pengembangan.
- File `.env`, `node_modules/`, `database.sqlite`, dan isi `uploads/` tidak ikut di-commit (lihat `.gitignore`).
