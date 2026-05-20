import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { normalizeUrl, validateUrl } from "../lib/validation.js";
import { scrapePost } from "../lib/scraper.js";
import { sendTelegramMessage } from "../lib/telegram.js";
import str from "../helpers/str.js";

const captions = new Hono();

captions.post("/", async (c) => {
  const body = await c.req.json<{ url: string; chatId?: string }>();

  if (!body.url || typeof body.url !== "string") {
    throw new HTTPException(400, { message: "url is required" });
  }

  let telegramSent = false;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const url = normalizeUrl(body.url);

  validateUrl(url);

  try {
    const caption = await scrapePost(url);

    const message = str(caption)
      .escape()
      .when(url.includes("instagram.com"), (s) => s.extractOutermostQuote())
      .get();

    if (body.chatId) {
      if (!token) throw new Error("Telegram bot token is not configured");

      await sendTelegramMessage(token, body.chatId, message);
      telegramSent = true;
    }

    return c.json({
      success: true,
      data: { caption: message, telegramSent },
      message: "Caption extracted successfully",
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error extracting caption:", error.message);
      throw new HTTPException(500, { message: error.message });
    }
    throw new HTTPException(500, { message: "Opps something went wrong." });
  }
});

export default captions;
