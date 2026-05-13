import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { HTTPException } from "hono/http-exception";

export async function scrapePost(url: string): Promise<string> {
  let browser;

  try {
    const isDev = process.env.NODE_ENV === "development";

    browser = await puppeteer.launch({
      args: isDev
        ? ["--no-sandbox", "--disable-setuid-sandbox"]
        : chromium.args,
      executablePath: isDev
        ? process.env.CHROME_EXECUTABLE_PATH
        : await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    const caption = await page
      .$eval('meta[name="description"]', (el) => el.getAttribute("content"))
      .catch(() => null);

    if (!caption) {
      throw new Error("Caption not found in page metadata");
    }

    return caption;
  } catch (error) {
    console.error("Scraping error:", error);
    throw new HTTPException(500, {
      message: error instanceof Error ? error.message : "Failed to scrape post",
    });
  } finally {
    await browser?.close();
  }
}
