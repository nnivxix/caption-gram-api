import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { normalizeUrl, validateUrl } from "../lib/validation";
import { scrapePost } from "../lib/scraper";
import { sendTelegramMessage } from "../lib/telegram";

const captions = new Hono();

captions.post("/", async (c) => {
  const body = await c.req.json<{ url: string; chatId?: string }>();

  if (!body.url || typeof body.url !== "string") {
    throw new HTTPException(400, { message: "url is required" });
  }

  const url = normalizeUrl(body.url);
  validateUrl(url);

  const caption = await scrapePost(url);

  let telegramSent = false;

  if (body.chatId) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (token) {
      try {
        const timestamp = new Date().toLocaleString("id-ID", {
          timeZone: "Asia/Jakarta",
          dateStyle: "medium",
          timeStyle: "short",
        });

        const message = `
🎯 *Caption Extracted!*

${escapeMarkdown(caption)}

🔗 [View Post](${url})
⏰ Time: ${timestamp}
        `.trim();

        await sendTelegramMessage(token, body.chatId, message);
        telegramSent = true;
      } catch (error) {
        console.error("Failed to send Telegram notification:", error);
        // Telegram notification is optional — don't fail the request
      }
    }
  }

  return c.json({ success: true, data: { caption, telegramSent } });
});

function escapeMarkdown(text: string): string {
  return text.replace(/[_*()~`>#+=|{}]/g, "\\$&");
}

export default captions;
