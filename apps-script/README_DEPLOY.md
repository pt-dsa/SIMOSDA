# Panduan Deploy Backend SIKANDA (Google Apps Script)

Backend ini adalah **satu-satunya jalur tulis** ke Spreadsheet. Ia menangani:
CRUD pegawai yang aman multi-user, upload foto ke Drive, soft delete, setting BUP, dan email Buku Penjagaan otomatis.

> Estimasi waktu: ~10 menit. Hanya dilakukan **sekali** (kecuali saat ada update `Code.gs`).

---

## A. Pasang Script

1. Buka Google Spreadsheet database SIKANDA (yang berisi sheet `pegawai`).
2. Menu **Extensions → Apps Script**.
3. Hapus isi file `Code.gs` bawaan, lalu **tempel seluruh isi** `apps-script/Code.gs` dari paket ini.
4. Di bagian atas file, sesuaikan:
   - `SPREADSHEET_ID` — pastikan sama dengan ID spreadsheet Anda (sudah diisi default).
   - `SHARED_SECRET` — **ganti** menjadi string acak panjang buatan Anda (mis. `sikanda_8f3k9x...`).
5. Klik **Save** (ikon disket).

## B. Deploy sebagai Web App

1. Klik **Deploy → New deployment**.
2. Ikon gerigi → pilih **Web app**.
3. Isi:
   - **Description**: `SIKANDA Backend v1`
   - **Execute as**: **Me** (akun pemilik spreadsheet)
   - **Who has access**: **Anyone**
4. Klik **Deploy** → **Authorize access** → pilih akun → "Advanced" → "Go to project (unsafe)" → **Allow**.
   *(Wajar muncul peringatan "unsafe" karena ini script milik Anda sendiri.)*
5. **Salin Web app URL** (berakhiran `/exec`).

## C. Sambungkan ke Frontend

Buka `src/appsScriptConfig.ts` lalu isi:

```ts
export const APPS_SCRIPT_URL: string = "https://script.google.com/macros/s/XXXX/exec"; // URL dari langkah B5
export const APPS_SCRIPT_SECRET: string = "sikanda_8f3k9x..."; // SAMA persis dengan SHARED_SECRET di Code.gs
```

## D. Aktifkan Notifikasi Email Otomatis

1. Di sheet **`system_config`**, tambahkan baris berikut (kolom `config_key` | `config_value`):
   - `BUP_USIA` | `58`  → batas usia pensiun (bisa diubah Administrator kapan saja).
   - `NOTIF_ADMIN_EMAIL` | `kepegawaian@email.go.id` → penerima rekap (Pola A).
   - `NOTIF_WINDOW_HARI` | `180` → ambang peringatan (hari ke depan).
2. Di editor Apps Script, klik ikon **jam (Triggers)** di kiri → **Add Trigger**:
   - Function: **`kirimNotifikasiBukuPenjagaan`**
   - Event source: **Time-driven** → **Day timer** → pilih jam (mis. 7–8am).
   - **Save** (otorisasi sekali lagi bila diminta).

Sejak titik ini sistem mengirim email **otomatis setiap hari** tanpa campur tangan Administrator:
rekap ke admin (Pola A) + email personal ke tiap pegawai yang punya alamat di kolom `EMAIL` (Pola B).

> Uji cepat: di Apps Script pilih fungsi `kirimNotifikasiBukuPenjagaan` → **Run**. Cek kotak masuk.

---

## E. Higiene Data (penting, sekali saja)

1. **Kolom NIP** di sheet `pegawai`: blok kolomnya → Format → Number → **Plain text**, agar 18 digit tidak berubah jadi notasi ilmiah.
2. Hapus baris uji yang bertanda `DATA DUMMY` di kolom `KETERANGAN` (SIKANDA juga otomatis menyembunyikannya).
3. Isi kolom **EMAIL** pegawai agar notifikasi personal (Pola B) terkirim.

## F. Bila Nanti `Code.gs` Diperbarui

**Deploy → Manage deployments → (pensil/Edit) → Version: New version → Deploy.**
URL `/exec` tetap sama, jadi `appsScriptConfig.ts` tidak perlu diubah.

---

### Catatan keamanan (jujur & ringkas)
- Model ini memakai *shared secret* + Web App "Execute as Me". Karena aplikasi berjalan di sisi browser, secret ini bukan rahasia mutlak — memadai untuk lingkungan internal dinas. Pengamanan lebih kuat (verifikasi token Firebase di server) bisa kita tambahkan di **Tahap 3 (Autentikasi)**.
- Keuntungannya: Spreadsheet **tidak perlu** dibuka tulis untuk publik — semua tulisan lewat backend yang berjalan sebagai Anda.
