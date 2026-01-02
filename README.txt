# Gudang LinkHub (Vercel Static)

Ini versi STATIC (HTML/CSS/JS) untuk dipasang di GitHub + Vercel.
Tidak ada admin panel. Edit link cukup lewat file JSON.

## Struktur
- index.html
- assets/ (css & js)
- data/links.json  <-- edit ini

## Cara deploy (GitHub + Vercel)
1) Buat repository GitHub baru
2) Upload semua file/folder ini ke repo
3) Vercel -> New Project -> Import repo -> Deploy (Framework: Other)
4) Selesai. Setiap edit links.json di GitHub, Vercel otomatis redeploy.

## Cara edit link
Buka `data/links.json` dan ubah:
- site.title / site.subtitle / site.brand
- categories[] / links[]

Catatan:
- Pastikan URL spreadsheet kamu sudah bisa diakses oleh karyawan (sharing permission).
