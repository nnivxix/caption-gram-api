export async function sendTelegramMessage(
  token: string,
  chatId: string,
  text: string,
): Promise<unknown> {
  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    },
  );

  if (!response.ok) {
    const data = (await response.json()) as { description?: string };
    throw new Error(
      data.description ?? `Telegram API error: ${response.status}`,
    );
  }

  return response.json();
}
