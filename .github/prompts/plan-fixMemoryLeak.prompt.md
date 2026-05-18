## Plan: Fix Memory Leak di `scraper.ts`

**TL;DR:** Setiap request melakukan `puppeteer.launch()` yang spawn Chromium baru. Chromium lambat release memory ke OS, dan `@sparticuz/chromium` memang didesain untuk AWS Lambda bukan VPS. Solusinya: browser singleton (launch sekali, reuse), close page bukan browser, dan ganti ke `puppeteer` biasa.

---

### Root Cause
- `scrapePost()` → `puppeteer.launch()` tiap request = spawn Chromium baru
- V8 GC tidak langsung free memory setelah `browser.close()`
- `@sparticuz/chromium` dioptimasi untuk Lambda cold-start, bukan server long-running
- Concurrent request = beberapa Chromium process hidup bersamaan

---

### Phase 1 — Ganti Dependency

1. Uninstall `puppeteer-core` + `@sparticuz/chromium`, install `puppeteer` (sudah include Chromium yang cocok untuk long-running VPS):
   ```
   pnpm remove puppeteer-core @sparticuz/chromium && pnpm add puppeteer
   ```

### Phase 2 — Buat Browser Singleton

2. Buat file baru `src/lib/browser.ts` dengan fungsi `getBrowser()`:
   - Cek `browserInstance?.connected` sebelum launch ulang
   - Pasang listener `browserInstance.on('disconnected', () => browserInstance = null)` agar auto-reconnect kalau crash
   - Args: `["--no-sandbox", "--disable-dev-shm-usage"]` untuk VPS

### Phase 3 — Refactor scraper.ts

3. Modifikasi `src/lib/scraper.ts`:
   - Hapus `puppeteer.launch()` dan semua logic `isDev`
   - Import dan gunakan `getBrowser()` dari `./browser.js`
   - Di blok `finally`: `await page.close()` — **tutup page, bukan browser**
   - Hapus import `@sparticuz/chromium`

---

### Files yang Dimodifikasi
- `src/lib/scraper.ts` — refactor ke singleton
- `src/lib/browser.ts` *(baru)* — singleton browser manager
- `package.json` — ganti dependency

---

### Verification
1. `pnpm build` — pastikan TypeScript compile bersih
2. Hit `/api/ig` beberapa kali, monitor memory via `/debug/memory` (endpoint sementara) atau `pm2 monit`
3. Cek `heapUsed` seharusnya stabil, tidak terus naik
4. Test concurrent: 5 request sekaligus → hanya 1 Chromium process yang jalan

---

### Decisions
- **Tidak** pakai browser pool (`generic-pool`) — singleton sudah cukup untuk use case ini
- **Tidak** tambah request queue sekarang — bisa dievaluasi nanti jika ada high concurrency
- `CHROME_EXECUTABLE_PATH` env var tidak lagi diperlukan setelah migrasi ke `puppeteer`
