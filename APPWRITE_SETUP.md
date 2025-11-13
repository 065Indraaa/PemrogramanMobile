# Appwrite Setup Guide - Bookmarks Collection

## Langkah-langkah Setup Bookmarks Collection

### 1. Buka Appwrite Console
- Pergi ke https://cloud.appwrite.io
- Login dengan akun Anda
- Pilih project "Ai-crud-app"

### 2. Buat Collection "bookmarks"
- Pergi ke **Databases** → **66296f08c154213bd921** (databaseId)
- Klik **Create Collection**
- Nama: `bookmarks`
- Collection ID: `bookmarks`
- Klik **Create**

### 3. Tambahkan Attributes ke Collection

Tambahkan attributes berikut dengan urutan ini:

#### a. user (String)
- Attribute ID: `user`
- Type: String
- Size: 255
- Required: ✓
- Indexed: ✓

#### b. video (String)
- Attribute ID: `video`
- Type: String
- Size: 255
- Required: ✓
- Indexed: ✓

#### c. album (String)
- Attribute ID: `album`
- Type: String
- Size: 255
- Required: ✗ (Optional)
- Indexed: ✓

### 4. Set Permissions

Pergi ke **Settings** tab di collection:

**Read Access:**
- Pilih **Any** atau **Users**

**Create Access:**
- Pilih **Users**

**Update Access:**
- Pilih **Users**

**Delete Access:**
- Pilih **Users**

### 5. Verifikasi Setup

Setelah setup selesai, bookmarks akan otomatis tersimpan ke database dan tidak akan hilang saat logout/login.

## Struktur Data Bookmarks

```json
{
  "$id": "unique_id",
  "user": "user_id",
  "video": "video_id",
  "album": "album_id_atau_null"
}
```

## Testing

1. Login ke aplikasi
2. Bookmark beberapa video
3. Logout
4. Login kembali
5. Bookmarks harus tetap ada

---

**Note:** Jika Anda sudah membuat collection, pastikan attribute-nya sesuai dengan yang di atas.
