import { Hono } from "hono";
import { cors } from "hono/cors";
import captions from "./api/captions";
import telegram from "./api/telegram";
import { serve } from "@hono/node-server";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "https://captiom-gram.vercel.app"],
  }),
);

app.get("/", (c) => {
  return c.json({ message: "Hello Hono!", author: "Hanasa" });
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
