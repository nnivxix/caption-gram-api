## Troubleshooting: Memory Leak & Chrome Dependencies di VPS (Ubuntu 24.04)

---

### Problem 1 — Memory terus naik setelah request

**Penyebab:** `scrapePost()` memanggil `puppeteer.launch()` setiap request → spawn Chromium baru, V8 GC lambat release memory ke OS. `@sparticuz/chromium` didesain untuk AWS Lambda, bukan VPS long-running.

**Solusi:**
1. Ganti `puppeteer-core` + `@sparticuz/chromium` → `puppeteer`
2. Buat browser singleton di `src/lib/browser.ts` — launch sekali, reuse per request
3. Di `scraper.ts`: tutup `page`, bukan `browser` (`await page.close()`)
4. Tambahkan `pnpm.onlyBuiltDependencies` di `package.json` agar Chromium otomatis terdownload saat `pnpm install`

---

### Problem 2 — `Could not find Chrome`

**Penyebab:** `pnpm add puppeteer` tidak menjalankan post-install script (download Chromium) karena build scripts diignore.

**Solusi:**
```bash
npx puppeteer browsers install chrome
```
Atau tambahkan ke `package.json` agar otomatis saat install:
```json
"pnpm": {
  "onlyBuiltDependencies": ["puppeteer"]
}
```

---

### Problem 3 — `error while loading shared libraries`

**Penyebab:** Ubuntu 24.04 (Noble) minimal install tidak punya system libraries yang dibutuhkan Chrome.

**Diagnosa:**
```bash
ldd /home/ubuntu/.cache/puppeteer/chrome/linux-*/chrome-linux64/chrome | grep "not found"
```

**Solusi:**
```bash
sudo apt-get update && sudo apt-get install -y \
  libatk1.0-0t64 libatk-bridge2.0-0t64 libcups2t64 \
  libgbm1 libcairo2 libpango-1.0-0 \
  libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
  libatspi2.0-0t64 libasound2t64
```

> **Note:** Di Ubuntu 24.04, beberapa package menggunakan suffix `t64` (contoh: `libatk1.0-0t64` bukan `libatk1.0-0`).

---

### Monitoring Memory (Development)

Tambahkan endpoint di `src/index.ts`:
```ts
app.get("/debug/memory", (c) => {
  if (process.env.NODE_ENV !== "development") return c.json({ error: "Forbidden" }, 403);
  const mem = process.memoryUsage();
  return c.json({
    heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    rss: `${(mem.rss / 1024 / 1024).toFixed(2)} MB`,
  });
});
```

Monitor tiap 2 detik:
```bash
while true; do curl -s http://localhost:8000/debug/memory | jq; sleep 2; done
```

`heapUsed` seharusnya naik saat scraping lalu turun kembali — kalau terus naik, masih ada leak.