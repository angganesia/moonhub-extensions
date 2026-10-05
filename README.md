# MoonHub 🌙

MoonHub adalah aplikasi penampil anime dan manga berbasis ekstensi JSON lokal yang dirancang untuk memberikan pengalaman membaca dan menonton yang bersih, optimal, dan fleksibel. Aplikasi ini dikembangkan menggunakan **React Native (Expo)** 

---

## 🏗️ Arsitektur & Aturan Sistem Ekstensi

MoonHub menggunakan pendekatan modular berbasis ekstensi. Setiap sumber dikontrol melalui file konfigurasi skema **JSON** 

### 1. Struktur Standar File JSON Ekstensi (`*.json`)
Setiap ekstensi wajib memuat metadata serta pemetaan *endpoints* dan *selectors* dengan format berikut:

```json
{
  "metadata": {
    "id": "nama_unik_ekstensi",
    "name": "Nama Ekstensi",
    "baseUrl": "https://situs-target.com",
    "version": "1.1.0",
    "type": "anime", 
    "lang": "id",
    "isNsfw": false
  },
  "endpoints": {
    "latest": "/",
    "latestPage": "/page/{page}/",
    "search": "/page/{page}/?s={query}",
    "filter": "/anime/?page={page}&{query}",
    "optionList": "/anime/"
  },
  "selectors": {
    "latest": {
      "item": "...",
      "titleAttr": "...",
      "coverAttr": "..."
    },
    "search": {
      "item": "...",
      "titleAttr": "...",
      "coverAttr": "...",
      "link": "..."
    },
    "filter": {
      "item": "...",
      "titleAttr": "...",
      "coverAttr": "...",
      "link": "..."
    },
    "optionList": {
      "item": "...",
      "labelAttr": "text",
      "valueAttr": "value"
    },
    "detail": { ... },
    "stream": { ... }
  }
}
