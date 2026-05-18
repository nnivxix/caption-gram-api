import { HTTPException } from "hono/http-exception";

export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return "https://" + trimmed;
  }
  return trimmed;
}

export function validateUrl(url: string): void {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw new HTTPException(400, {
      message: "URL must be a valid absolute URL",
    });
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    throw new HTTPException(400, { message: "URL must use http or https" });
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  const isInstagram = isAllowedHostname(hostname, ["instagram.com"]);
  const isYoutube = isAllowedHostname(hostname, ["youtube.com", "youtu.be"]);
  const isFacebook = isAllowedHostname(hostname, [
    "facebook.com",
    "fb.watch",
    "fb.com",
  ]);

  if (!isInstagram && !isYoutube && !isFacebook) {
    throw new HTTPException(400, {
      message: "URL must be an Instagram, YouTube, or Facebook link",
    });
  }
}

function isAllowedHostname(hostname: string, allowedHosts: string[]): boolean {
  return allowedHosts.some(
    (allowedHost) =>
      hostname === allowedHost || hostname.endsWith(`.${allowedHost}`),
  );
}
