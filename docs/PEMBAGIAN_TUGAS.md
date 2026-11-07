# Pembagian Tugas Kelompok EcoCraft: Fase UTS

Kelompok 3 orang (ketentuan **3 Kelompok (Minimum)**).

Target UTS: "Web Client berhasil berkomunikasi dua arah dengan API Server." Isinya: dokumentasi, API server, aplikasi web, dan web terintegrasi dengan API (CRUD).

| Anggota | Role | Area kerja UTS |
|---|---|---|
| **Nicholas** | A: API & Web | Server Node.js + SQLite, Web Client React TS, koordinasi Git |
| **Justin** | B: API & Dokumen | Modul API Tutorial & Aksi, dokumen analisis (Use Case, Flowchart) |
| **Khenwil** | C: API & Dokumen | Modul API Titik Setor & Reward, dokumen desain (Data Model, Integration Doc) |

Aturan Git: setiap orang commit dengan akun GitHub masing-masing. Dosen mengecek riwayat commit per anggota.

---

## Nicholas (Role A: API & Web)

- [ ] Membuat repository GitHub dan mengundang Justin dan Khenwil
- [ ] Menjalankan server (`npm install`, `npm run dev`, `npm test`) dan web (`npm run dev`)
- [ ] Memastikan web bisa GET, POST, PUT, dan DELETE ke API untuk tutorial, aksi, dan titik setor
- [ ] Menjaga `docs/API.md` tetap sesuai dengan endpoint yang sebenarnya
- [ ] Me-review pull request dari Justin dan Khenwil sebelum digabung
- [ ] Dokumen master: Latar Belakang, Requirement/Problem, API Integration, API Documentation

## Justin (Role B: API & Dokumen)

- [ ] Mencoba endpoint tutorial dan aksi lewat Postman (`docs/EcoCraft-API.postman_collection.json`)
- [ ] Membuat satu pull request yang menambah atau merapikan satu fitur di modul tutorial atau aksi, beserta tesnya di `server/tests/api.test.js`
- [ ] Dokumen master: Use Case Diagram dan Flowchart (basic)

## Khenwil (Role C: API & Dokumen)

- [ ] Mencoba endpoint titik setor dan reward lewat Postman
- [ ] Membuat satu pull request yang menambah atau merapikan satu fitur di modul titik setor atau reward, beserta tesnya
- [ ] Dokumen master: Data Model (basic), berdasarkan `server/src/config/database.js`
- [ ] Dokumen master: Integration Doc (basic), berisi cara web terhubung ke API

## Bersama

- [ ] Setiap fitur dikerjakan di branch sendiri, lalu digabung lewat pull request yang di-review Nicholas
- [ ] Dokumen master UTS dikumpulkan dalam satu file PDF
- [ ] Source code: tautan repository GitHub diundang ke dosen
