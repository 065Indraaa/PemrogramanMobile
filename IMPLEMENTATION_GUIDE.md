# 📚 Album Feature Implementation Guide

## ✅ Perbaikan yang Telah Dilakukan

### 1. **Bookmark Retrieval - FIXED** ✅
**Masalah:** Video yang di-bookmark tidak muncul di halaman bookmark

**Perbaikan:**
- Menambahkan logging komprehensif di `getBookmarkedPosts()` untuk debugging
- Memperbaiki handling relasi video (support object dan string ID)
- Menambahkan fallback query jika video ID tidak ditemukan
- Memastikan video dengan relasi bekerja dengan benar

**Cara cek:**
```
LOG getBookmarkedPosts: fetching bookmarks for userId: [your_user_id]
LOG getBookmarkedPosts: found X bookmarks by profile ID
LOG getBookmarkedPosts: sample bookmark structure: {...}
LOG getBookmarkedPosts: extracted X unique video IDs
LOG getBookmarkedPosts: returning X enriched videos
```

### 2. **Upload Success Popup - IMPROVED** ✅
**Perbaikan:**
- Popup lebih informatif dengan judul video
- Dua pilihan aksi: "View in Home" atau "Upload Another"
- Error message lebih jelas
- Loading state pada tombol

### 3. **Realtime Synchronization - IMPLEMENTED** ✅
**Perbaikan:**
- Home page auto-refresh saat bookmark berubah
- Profile page auto-refresh
- Bookmark page auto-refresh
- State konsisten di semua tab

### 4. **Album Feature - NEW** 🆕

#### A. Database Schema (Harus Setup di Appwrite!)
**Collection baru: `albums`**
- `name` (String, required): Nama album
- `description` (String, optional): Deskripsi album
- `user` (Relationship, Many-to-One ke users): Pemilik album
- `isDefault` (Boolean): Flag untuk album default

**Update Collection: `bookmarks`**
- Tambah atribut `album` (Relationship, Many-to-One ke albums, optional)

> **PENTING:** Lihat file `ALBUM_SETUP.md` untuk panduan lengkap setup database!

#### B. Fitur Album yang Tersedia

**1. Buat Album Baru**
- Tap tombol "+ Album" di halaman Bookmark
- Isi nama album (wajib) dan deskripsi (opsional)
- Album langsung tersimpan dan siap digunakan

**2. Bookmark dengan Album**
- Saat bookmark video dari Home/Profile, popup album selector muncul
- Pilih album tujuan atau "No Album" untuk tidak assign ke album
- Video langsung masuk ke album yang dipilih

**3. Filter Bookmark by Album**
- Scroll horizontal tabs di halaman Bookmark
- Tap "All" untuk lihat semua bookmark
- Tap "Unassigned" untuk lihat bookmark tanpa album
- Tap nama album untuk filter bookmark di album tersebut
- Jumlah bookmark per album ditampilkan di tab

**4. Hapus Album**
- Long press pada tab album
- Konfirmasi penghapusan
- Bookmark di dalam album TIDAK DIHAPUS, hanya jadi "Unassigned"

#### C. File-file Baru
1. **`lib/albums.js`** - Album management functions
2. **`components/AlbumSelector.jsx`** - Modal untuk pilih/buat album
3. **`ALBUM_SETUP.md`** - Panduan setup database Appwrite
4. **`IMPLEMENTATION_GUIDE.md`** - File ini

## 🚀 Cara Testing

### Step 1: Setup Database Appwrite
1. Baca dan ikuti `ALBUM_SETUP.md`
2. Buat collection `albums`
3. Update collection `bookmarks` dengan atribut `album`
4. Setup permissions yang benar
5. Buat indexes untuk performa

### Step 2: Test Bookmark Basic Flow
1. **Buka Home page**
   - Pilih video
   - Tap menu (3 titik)
   - Tap "Bookmark"
   - **Popup album selector akan muncul**
   - Pilih "No Album" dulu untuk test basic
   - Cek console log: `⭐ Added bookmark for video [id]`

2. **Cek Bookmark Page**
   - Pindah ke tab Saved/Bookmark
   - Video harus muncul di sini
   - Cek console log untuk debug jika tidak muncul
   - Perhatikan tab "All" dan "Unassigned"

3. **Test Unbookmark**
   - Di Home atau Bookmark page
   - Tap menu → "Unbookmark"
   - Video hilang dari Bookmark page
   - Cek console log: `🔖 Removed bookmark for video [id]`

### Step 3: Test Album Features
1. **Buat Album Pertama**
   - Di Bookmark page, tap "+ Album"
   - Masukkan nama: "Favorites"
   - Deskripsi: "My favorite videos"
   - Tap "Create"
   - Album muncul di horizontal tabs

2. **Bookmark ke Album**
   - Kembali ke Home
   - Bookmark video baru
   - **Pilih album "Favorites" di popup**
   - Video masuk ke album Favorites

3. **Filter by Album**
   - Di Bookmark page
   - Tap tab "Favorites"
   - Hanya video di album Favorites yang muncul
   - Jumlah bookmark ditampilkan: "Favorites (1)"

4. **Buat Album Lain**
   - Buat album "Watch Later"
   - Buat album "Tutorials"
   - Bookmark beberapa video ke setiap album
   - Test filtering antar album

5. **Test Unassigned Bookmarks**
   - Bookmark video tanpa album ("No Album")
   - Tap tab "Unassigned"
   - Video tanpa album muncul di sini

6. **Delete Album**
   - Long press album di tabs
   - Konfirmasi delete
   - Album hilang
   - **Penting:** Bookmarks di dalamnya jadi "Unassigned" (tidak terhapus)

### Step 4: Test Realtime Sync
1. Bookmark video di Home
2. **Tanpa refresh**, pindah ke Bookmark page
3. Video harus langsung muncul (realtime)
4. Unbookmark di Bookmark page
5. **Tanpa refresh**, pindah ke Home
6. Status bookmark harus update otomatis

### Step 5: Test Edge Cases
1. **Video tanpa title:** Harus muncul sebagai "Untitled Video"
2. **Bookmark duplicate:** Tidak error, dianggap success
3. **Unbookmark yang tidak punya permission:** Error handled gracefully
4. **Search:** Cari video di Bookmark page by title/description
5. **Orphan cleanup:** Test tombol "Clean Up" untuk bookmark tanpa video

## 🐛 Debugging

### Bookmark Tidak Muncul di Bookmark Page

**Cek Console Logs:**
```
getBookmarkedPosts: fetching bookmarks for userId: [id] albumId: undefined
getBookmarkedPosts: found X bookmarks by profile ID
getBookmarkedPosts: total unique bookmarks: X
getBookmarkedPosts: sample bookmark structure: {...}
```

**Kemungkinan Penyebab:**
1. **User ID salah:** Pastikan `user.$id` adalah profile ID, bukan account ID
2. **Relasi video salah:** Cek di Appwrite Console, apakah `bookmarks.video` adalah relasi atau string
3. **Video dihapus:** Jika video sudah dihapus, bookmark tidak akan muncul (orphan)
4. **Permission:** Cek permission bookmark document di Appwrite

**Solusi:**
- Lihat `sample bookmark structure` di log
- Jika `videoIsRelation: true`, video harus dalam bentuk object dengan `$id`
- Jika `videoIsRelation: false`, video berupa string ID
- Pastikan video ID yang disimpan valid

### Album Tidak Muncul

**Cek:**
1. Collection `albums` sudah dibuat di Appwrite?
2. Attribute `album` sudah ditambahkan ke collection `bookmarks`?
3. Permissions sudah diset?
4. Console log: `📁 Found X albums for user: [id]`

### Popup Album Tidak Muncul Saat Bookmark

**Cek:**
1. Import `AlbumSelector` di `VideoCard.jsx`?
2. State `albumSelectorVisible` ada?
3. `handleBookmark` memanggil `setAlbumSelectorVisible(true)` untuk bookmark baru?

### Error "Collection not found" atau "Attribute not found"

**Solusi:**
1. Baca ulang `ALBUM_SETUP.md`
2. Pastikan collection ID persis `albums` (lowercase, no quotes)
3. Pastikan attribute names match exactly
4. Restart Appwrite dan app jika perlu

## 📝 Console Log Guide

### Normal Flow (Success):
```
// Saat bookmark video
toggleBookmark: create raced, using existing bookmark  // Jika sudah ada (race condition)
⭐ Added bookmark for video [videoId]  // Atau ini jika baru

// Saat fetch bookmarks
getBookmarkedPosts: fetching bookmarks for userId: [userId] albumId: undefined
getBookmarkedPosts: found 3 bookmarks by profile ID
getBookmarkedPosts: total unique bookmarks: 3
getBookmarkedPosts: sample bookmark structure: { id: ..., video: ..., user: ... }
getBookmarkedPosts: extracted 3 unique video IDs: [id1, id2, id3]
getBookmarkedPosts: fetching 3 videos...
getBookmarkedPosts: successfully fetched video: [id] title: "My Video"
getBookmarkedPosts: successfully fetched 3 out of 3 videos
getBookmarkedPosts: returning 3 enriched videos
getBookmarkedPosts: first video: { id: ..., title: "My Video", hasCreator: true, ... }

// Saat unbookmark
🔖 Removed bookmark for video [videoId]

// Saat buat album
📁 Created album: Favorites
```

### Error Indicators:
```
// Video tidak ditemukan
getBookmarkedPosts: getDocument failed for video: [id] error: Document not found
getBookmarkedPosts: completely failed to fetch video (skipping): [id]

// Permission error
toggleBookmark: delete failed for [id] The current user is not authorized...

// No video IDs extracted
getBookmarkedPosts: no video IDs found, returning empty array
```

## 🎨 UI/UX Features

### Interactive Elements:
- **Album Tabs:** Horizontal scrollable, auto-highlight selected
- **Long Press:** Pada tab album untuk delete
- **Color Coding:** 
  - Selected tab: Orange (secondary)
  - Unselected: Dark gray
  - Create button: Orange
- **Empty States:** Contextual message based on filter
- **Loading States:** Spinner di tab saat load album
- **Search:** Real-time filter saat user mengetik

### Animations:
- Album selector slide up
- Video card transitions
- Tab selection feedback

## ⚠️ Known Limitations

1. **Legacy Bookmarks:** Bookmark lama tanpa proper permissions tidak bisa di-unbookmark. Solusi: Gunakan "Clean Up" button atau recreate bookmark.

2. **Orphan Bookmarks:** Jika video dihapus tapi bookmark masih ada, tidak akan muncul di list. Gunakan "Clean Up" untuk remove.

3. **Album Name Uniqueness:** Album name tidak harus unique (users bisa punya 2 album bernama sama).

4. **Concurrent Bookmarks:** Jika user bookmark video yang sama dari 2 device simultaneously, deterministic ID mencegah duplicate.

## 🔧 Maintenance

### Menambah Fitur Album Lain:
- **Edit Album:** Sudah ada function `updateAlbum()` di `lib/albums.js`
- **Reorder Albums:** Tambahkan `position` attribute dan sort by position
- **Album Cover:** Tambahkan `coverImage` attribute
- **Share Album:** Implement sharing dengan change permissions

### Performance Tips:
- Albums dan counts di-fetch parallel
- Realtime updates di-debounce 250ms
- Bookmark fetch sudah di-optimize dengan parallel queries
- Index database untuk fast filtering

## 📞 Support

Jika masih ada masalah:
1. Copy console logs lengkap
2. Screenshot error message
3. Jelaskan step yang dilakukan
4. Cek Appwrite Console untuk verify data structure

---

**Last Updated:** November 2024
**Version:** 1.0.0
**Author:** Cascade AI Assistant
