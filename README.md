# Jepang N3–N2 🇯🇵

Web app belajar **Bahasa Jepang dari level N3 menuju N2** untuk penggunaan sehari-hari di Jepang — materi kerja IT Project, keluarga & kesehatan, urusan shiyakusho, dan bisnis/keigo, semuanya dengan penjelasan **Bahasa Indonesia**.

**Link aplikasi yang direncanakan:** https://kharismaleader.github.io/Jepang-N3-N2/

App ini adalah versi HTML dari materi harian yang sebelumnya berbentuk PDF + Quiz Google Form: sekarang materi, dialog, dan quiz-nya bisa dibuka dalam satu aplikasi yang ramah iPhone, mirip aplikasi Kantong-Yen.

## Fitur

- **Beranda** — materi terbaru: tanggal, tema, target hari ini, ringkasan grammar & vocab sekilas, tombol *Mulai Belajar* dan *Kerjakan Quiz*, plus indikator progres hari itu.
- **Materi** — pemilih tanggal, lalu:
  - Kartu grammar yang bisa dibuka-tutup (pola, romaji, arti, cara membentuk, nuansa, contoh Jepang + terjemahan Indonesia) dengan tombol centang **“sudah paham”**.
  - Daftar vocab (kata, cara baca, arti, contoh kalimat) dan **mode kartu kilat**: ketuk kartu untuk membalik dan melihat arti, tombol centang **hafal**.
  - Dialog dalam balon percakapan (Jepang + terjemahan Indonesia di bawahnya).
  - Tips hafalan dan tautan **“Buka PDF asli”** bila PDF hari itu tersedia.
- **Quiz** — 10 soal per tanggal, satu soal per layar: ketuk jawaban langsung terlihat benar/salah + penjelasan Bahasa Indonesia; di akhir tampil skor dan tombol ulangi. Skor terbaik per tanggal disimpan di perangkat.
- **Arsip** — semua tanggal dari yang terbaru, lengkap dengan tema, konteks, dan status progres; ketuk untuk membuka materi/quiz tanggal itu. Ada kotak pencarian berdasarkan tema, grammar, atau vocab.
- Progres belajar (grammar dipahami, vocab dihafal, skor quiz) tersimpan lokal di perangkat (`localStorage`), jadi tetap ada walau offline.
- Navigasi bawah ala iPhone: **Beranda | Materi | Quiz | Arsip**. Tanpa mode standalone terpisah — shortcut Home Screen membuka tab Safari biasa.

## Cara kerja data

```
Google Sheet "Materi"  →  Apps Script Web App (/exec)  →  aplikasi ini (fetch JSON)
                                                              ↘ seed.json (cadangan di repo)
                                                              ↘ data contoh bawaan (fallback terakhir)
```

1. Materi baru setiap hari ditulis ke Google Sheet **“Materi”**.
2. Apps Script yang terikat ke Sheet itu di-deploy sebagai Web App dan mengembalikan JSON materi. Setiap permintaan diperiksa dengan **kode akses** yang dimasukkan sekali per perangkat lewat tombol **“Kode akses”** di aplikasi (kode hanya disimpan di perangkat, bukan di kode sumber).
3. Urutan muat data di aplikasi: (1) cache di perangkat bila ada, (2) Sheet lewat Apps Script bila `SYNC_URL` sudah diisi dan kode akses ada — tombol **“Sinkronkan”** memaksa muat ulang, (3) file `seed.json` di repo yang sama sebagai cadangan, (4) data contoh bawaan untuk demo.
4. Aplikasi menampilkan sumber datanya dengan halus di bawah header, misalnya “Data: Sheet • …” atau “Data contoh”.

Format JSON yang dikembalikan Apps Script / isi `seed.json`:

```json
{"ok":true,"materi":[{"date":"YYYY-MM-DD","theme":"...","context":"...","target":"...","tips":"...","pdf":"https://...",
"grammar":[{"no":1,"level":"N3","pattern":"...","romaji":"...","meaning":"...","formation":"...","nuance":"...","examples":[{"jp":"...","id":"..."}]}],
"vocab":[{"no":1,"word":"...","reading":"...","meaning":"...","example_jp":"...","example_id":"..."}],
"dialog":[{"no":1,"speaker":"...","jp":"...","id":"..."}],
"quiz":[{"no":1,"type":"Grammar","question":"...","options":["A","B","C","D"],"answer":0,"explanation":"..."}]}]}
```

## Memperbarui SYNC_URL

1. Deploy Apps Script Sheet “Materi” sebagai Web App dan salin URL-nya (berakhiran `/exec`).
2. Buka `index.html`, cari konstanta di dekat atas `<script>`:

   ```js
   const SYNC_URL = "";
   ```

3. Isi dengan URL `/exec` tersebut, commit, dan push. Setelah GitHub Pages ter-update, isi **Kode akses** sekali di setiap perangkat, lalu ketuk **Sinkronkan**.

## Daftar file

| File | Isi |
|---|---|
| `index.html` | Seluruh aplikasi (HTML + CSS + JavaScript dalam satu file, tanpa build step) |
| `seed.json` | Data cadangan dalam format yang sama dengan respons Apps Script, dipakai bila Sheet belum terhubung/gagal dimuat |
| `hasian.gif` | Avatar Hasian (bulat 40px) di kiri atas header |
| `README.md` | Dokumen ini |

## Catatan teknis

- Satu file `index.html` mandiri, hosting GitHub Pages dari branch `main`, folder root — direncanakan di repo `Jepang-N3-N2`.
- Tidak ada tahun yang ditulis mati di kode; semua tanggal berasal dari data materi.
- Palet warna mengikuti materi PDF-nya: teal `#0E5F56` dan aksen oranye `#F28C28`.
