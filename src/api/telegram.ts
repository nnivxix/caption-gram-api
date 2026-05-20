import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { sendTelegramMessage } from "../lib/telegram.js";

const telegram = new Hono();

telegram.post("/validate", async (c) => {
  const { chatId } = await c.req.json<{ chatId: string }>();

  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new HTTPException(500, {
      message: "Telegram bot token not configured",
    });
  }

  if (!chatId) {
    throw new HTTPException(400, { message: "Chat ID is required" });
  }

  const message = `
✅ *Chat ID Validated Successfully!*

Your Telegram Chat ID has been verified and saved.
You will now receive caption notifications here.

🤖 Caption Gram Bot is ready to send you captions!
  `.trim();

  try {
    await sendTelegramMessage(token, chatId, message);
    return c.json({
      success: true,
      message: "Chat ID validated successfully!",
    });
  } catch (error) {
    throw new HTTPException(400, {
      message: "Invalid Chat ID. Please check and try again.",
    });
  }
});

export default telegram;
