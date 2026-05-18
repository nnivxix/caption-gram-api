import { getBrowser } from "./browser.js";
import { HTTPException } from "hono/http-exception";

export async function scrapePost(url: string): Promise<string> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setUserAgent({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

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
    await page.close();
  }
}
