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

app.route("/api/ig", captions);
app.route("/api/telegram", telegram);

serve(
  {
    fetch: app.fetch,
    port: 8000,
  },
  (info) => {
    console.log(`Server running at http://localhost:${info.port}`);
  },
);
