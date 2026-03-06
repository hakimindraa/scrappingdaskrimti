# PLAN UI - Manual SIPEDE Statistics Input (v2)

## 📋 RINGKASAN
Plan UI untuk fitur input manual statistik SIPEDE yang akan ditambahkan ke InsightTab. Fitur ini memungkinkan user untuk input 6 field data statistik pegawai SIPEDE secara manual dan melihat visualisasi dalam 3 donut charts di dashboard.

---

## 🎯 TUJUAN
- Memberikan cara mudah untuk input statistik SIPEDE tanpa perlu upload Excel
- Menampilkan visualisasi data dalam 3 donut charts yang sudah ada (menggantikan hardcode)
- Menyimpan data di localStorage agar persisten
- Terpisah dari fitur upload Excel yang sudah ada

---

## 📐 STRUKTUR UI

### LOKASI PENEMPATAN

Fitur ini terdiri dari 2 bagian yang terpisah:

**A. FORM INPUT (6 Fields)** → Di section "Pengelompokan Data Surat" (bagian atas)
**B. 3 DONUT CHARTS** → Di Dashboard SIPEDE, Card "Persentase User SIPEDE" (update hardcode)

```
┌─────────────────────────────────────────────────────────┐
│  InsightTab                                             │
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────┐  │
│  │  PENGELOMPOKAN DATA SURAT                         │  │
│  │  - Upload Excel (existing)                        │  │
│  │  - [BARU] Form Input SIPEDE (6 fields)           │  │ ← Form Input Baru
│  │  - Tab Jenis/Asal (existing)                      │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  DASHBOARD SIPEDE                                 │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │ Card: PERSENTASE USER SIPEDE                │  │  │
│  │  │ [UPDATE] 3 Donut Charts (Dynamic)           │  │ ← 3 Donut Update
│  │  │ 1. Status Aktif (100%)                      │  │  │
│  │  │ 2. Tercatat SIPEDE (94%)                    │  │  │
│  │  │ 3. Terdaftar E-sign (62%)                   │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 DATA MAPPING

### Input Fields → Donut Charts


**6 Input Fields:**
1. Status Aktif: 131
2. Status Tidak Aktif: 0
3. Tercatat SIPEDE: 131
4. Tidak Tercatat SIPEDE: 8
5. Terdaftar E-sign: 56
6. Tidak Terdaftar E-sign: 83

**3 Donut Charts:**

**Donut 1: Status Aktif**
- Numerator: Status Aktif (131)
- Denominator: Status Aktif + Status Tidak Aktif (131 + 0 = 131)
- Percentage: 131/131 = 100%
- Label: "Status Aktif"

**Donut 2: Tercatat SIPEDE**
- Numerator: Tercatat SIPEDE (131)
- Denominator: Tercatat SIPEDE + Tidak Tercatat SIPEDE (131 + 8 = 139)
- Percentage: 131/139 = 94.2%
- Label: "Tercatat SIPEDE"

**Donut 3: Terdaftar E-sign**
- Numerator: Terdaftar E-sign (56)
- Denominator: Terdaftar E-sign + Tidak Terdaftar E-sign (56 + 83 = 139)
- Percentage: 56/139 = 40.3%
- Label: "Terdaftar E-sign"

---

## 🎨 DESAIN KOMPONEN

### BAGIAN A: FORM INPUT (Di Section Pengelompokan)

Form input akan ditambahkan di section "Pengelompokan Data Surat", setelah upload buttons dan sebelum tab bar.

```
┌─────────────────────────────────────────────────────────────┐
│  PENGELOMPOKAN DATA SURAT                                   │
│  [📥 Surat Masuk] [📤 Surat Keluar]  ← Existing            │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │  📊 INPUT STATISTIK SIPEDE MANUAL                     │  │
│  │                                                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │ Status Aktif │  │ Status Tidak │  │ Tercatat    │ │  │
│  │  │ [   131   ]  │  │ Aktif [  0 ] │  │ SIPEDE      │ │  │
│  │  └──────────────┘  └──────────────┘  │ [   131   ] │ │  │
│  │                                       └─────────────┘ │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │ Tidak        │  │ Terdaftar    │  │ Tidak       │ │  │
│  │  │ Tercatat     │  │ E-sign       │  │ Terdaftar   │ │  │
│  │  │ SIPEDE [  8] │  │ [    56   ]  │  │ E-sign      │ │  │
│  │  └──────────────┘  └──────────────┘  │ [    83   ] │ │  │
│  │                                       └─────────────┘ │  │
│  │                                                        │  │
│  │  [💾 Simpan Data]                                     │  │
│  │  ✅ Data berhasil disimpan!                           │  │
│  └───────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  [JENIS SURAT] [ASAL SURAT]  ← Existing Tab Bar            │
└─────────────────────────────────────────────────────────────┘
```

