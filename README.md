# 📱 AORA — Aplikasi Cloud Video Storage

> **Modifikasi Aplikasi AORA** | Tugas Akhir Praktikum Pemrograman Mobile  
> Program Studi S1 Pendidikan Teknologi Informasi — Fakultas Teknik  
> Universitas Negeri Surabaya 2025

---

## 👥 Anggota Kelompok 7 PTI 2024 C

| No | Nama | NIM |
|:--:|------|:---:|
| 1 | Indra Bachtiar Zakaria | 24050974065 |
| 2 | Ericha Okti Virlya Meyjie | 24050974072 |
| 3 | Rina Dwi Apri Lestari | 24050974076 |
| 4 | Dhifa Barata Putra | 24050974085 |
| 5 | Bintang Alief Artha Mei Vira | 24050974094 |

**Dosen Pengampu:**
- I Gusti Lanang Putra Eka Prismana, S.Kom., M.Kom.
- Ir. Rizky Basatha, S.Pd., M.MT.

---

## 📖 Deskripsi Proyek

Aplikasi **AORA** adalah aplikasi *cloud video storage* berbasis mobile yang dikembangkan menggunakan **React Native** dan **Appwrite** sebagai backend. Aplikasi ini memungkinkan pengguna untuk menyimpan, mengelola, dan mengakses koleksi video pribadi secara aman dan private — setiap pengguna hanya dapat melihat video miliknya sendiri.

Proyek ini merupakan **modifikasi komprehensif** dari aplikasi AORA versi awal, mencakup penyempurnaan fitur CRUD, peningkatan tampilan UI/UX, implementasi sistem notifikasi, serta perbaikan berbagai bug teknis.

---

## ✨ Fitur Utama

### 🔐 Autentikasi
- Sign Up dengan validasi field lengkap
- Login dengan kredensial yang aman
- Logout dengan dialog konfirmasi

### 🎬 Manajemen Video (CRUD Lengkap)
- **Create** — Upload video beserta thumbnail, judul, dan deskripsi/caption
- **Read** — Tampilan video pribadi di halaman Home dan Profile
- **Update** — Edit judul dan deskripsi video langsung dari halaman Profile
- **Delete** — Hapus video dengan dialog konfirmasi sebelum eksekusi

### 🔖 Bookmark
- Simpan video favorit ke daftar bookmark
- Kategori "All" dan "Unassigned" untuk organisasi
- Search bar untuk mencari video yang di-bookmark

### 🔒 Privasi & Keamanan
- Sistem akses video **private** — setiap user hanya melihat video miliknya
- Tidak ada video publik antar pengguna

### 🔔 Sistem Notifikasi
- `"Success, post uploaded successfully"` — setelah upload video
- `"Success, video updated successfully"` — setelah edit video
- `"Are you sure you want to delete this video?"` — konfirmasi sebelum hapus
- `"Success, added to bookmarks"` — saat bookmark video
- `"Are you sure want to log out?"` — konfirmasi sebelum logout

---

## 🎨 Desain & Color Palette

Aplikasi menggunakan skema warna modern dengan gradasi yang eye-catching:

| Warna | Hex | Fungsi |
|-------|-----|--------|
| Deep Purple | `#6B4CE6` | Primary Brand Color |
| Vibrant Orange | `#FF9F45` | Primary Accent Color |
| Soft Lavender | `#A78BFA` | Highlights |
| Peachy Orange | `#FFB85C` | Soft Accent |
| Dark Background | `#0F0F1E` | Main Background |
| Card Background | `#1A1A2E` | Cards & Containers |
| **Gradient** | Purple → Orange | Tombol utama & navigasi aktif |

---

## 🛠️ Teknologi yang Digunakan

| Teknologi | Kegunaan |
|-----------|----------|
| **React Native** | Framework pengembangan mobile cross-platform |
| **Expo Router** | Navigasi berbasis file routing |
| **Appwrite** | Backend as a Service (database, storage, auth) |
| **JavaScript** | Bahasa pemrograman utama |
| **Tailwind CSS** | Styling dan desain interface |
| **Expo ImagePicker** | Upload video dan thumbnail |

---

## ▶️ Cara Menjalankan Aplikasi

### Prasyarat
Pastikan sudah menginstall:
- [Node.js](https://nodejs.org/) (v16 atau lebih baru)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Git](https://git-scm.com/)
- Akun [Appwrite](https://appwrite.io/) (untuk backend)

### Langkah Instalasi

```bash
# 1. Clone repository
git clone https://github.com/065Indraaa/PemrogramanMobile.git

# 2. Masuk ke folder project
cd PemrogramanMobile

# 3. Install dependencies
npm install

# 4. Jalankan aplikasi
npx expo start
```

### Konfigurasi Appwrite
Sesuaikan file konfigurasi Appwrite di `lib/appwrite.js` atau `APPWRITE_SETUP.md` dengan kredensial project Appwrite kamu.

---

## ⚠️ Troubleshooting

| Masalah | Solusi |
|---------|--------|
| `Cannot find module 'expo'` | Jalankan `npm install` terlebih dahulu |
| Thumbnail tidak muncul | Cek konfigurasi storage bucket di Appwrite |
| Login gagal terus | Pastikan endpoint dan project ID Appwrite sudah benar |
| Aplikasi crash saat buka | Pastikan versi Node.js minimal v16 |
| Video tidak muncul di Home | Cek permission collection di Appwrite database |

---

## 📁 Struktur Folder

```
PemrogramanMobile/
├── app/                  # Halaman aplikasi (Expo Router)
├── assets/               # Gambar, font, dan aset statis
├── components/           # Komponen UI yang dapat digunakan ulang
├── constants/            # Konstanta aplikasi (warna, dll)
├── context/              # Context API untuk state global
├── lib/                  # Konfigurasi Appwrite & helper functions
├── app.json              # Konfigurasi Expo
├── package.json          # Dependencies
└── README.md
```

---

## 📋 Status Pengujian

Semua fitur telah diuji menggunakan metode **Black Box Testing**:

| Fitur | Status |
|-------|--------|
| Authentication (Sign Up, Login, Logout) | ✅ Berhasil |
| Upload Video (Create) | ✅ Berhasil |
| Tampilan Video (Read) | ✅ Berhasil |
| Edit Video (Update) | ✅ Berhasil |
| Hapus Video (Delete) | ✅ Berhasil |
| Bookmark Video | ✅ Berhasil |
| Privasi Video (Private Access) | ✅ Berhasil |
| Sistem Notifikasi | ✅ Berhasil |
| Redesain UI/UX | ✅ Berhasil |

---

## 📅 Informasi Project

- **Mata Kuliah:** Pemrograman Mobile
- **Semester:** Genap 2024/2025
- **Institusi:** Universitas Negeri Surabaya (UNESA)
- **Fakultas:** Teknik
- **Program Studi:** S1 Pendidikan Teknologi Informasi

---

*Tugas Akhir Praktikum Pemrograman Mobile — Kelompok 7 PTI 2024 C*
