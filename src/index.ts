import { Hono } from "hono";
import { cors } from "hono/cors";
import captions from "./api/captions.js";
import telegram from "./api/telegram.js";
import { serve } from "@hono/node-server";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || [],
  }),
);

app.get("/", (c) => {
  return c.json({
    message: "Hello Hono!",
    author: "Hanasa",
  });
});

app.get("/debug/memory", (c) => {
  if (process.env.NODE_ENV !== "development") {
    return c.json(
      { error: "Memory usage info is only available in development mode" },
      403,
    );
  }
  const mem = process.memoryUsage();
  return c.json({
    heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    rss: `${(mem.rss / 1024 / 1024).toFixed(2)} MB`,
  });
});

app.route("/api/ig", captions);
app.route("/api/telegram", telegram);

serve(
  {
    fetch: app.fetch,
    port: Number(process.env.PORT) || 8000,
  },
  (info) => {
    console.log(`Server running at http://localhost:${info.port}`);
  },
);
