import site from "../../site.config.json";

export const PRODUCTION_URL = site.productionUrl.replace(/\/$/, "");

function trimOrigin(value: string | undefined): string {
  return value?.trim().replace(/\/$/, "") ?? "";
}

function isLocalOrigin(origin: string) {
  return (
    origin.includes("localhost") ||
    origin.includes("127.0.0.1") ||
    origin.includes("[::1]")
  );
}

export function publicAppOrigin(requestUrl?: string): string {
  const fromEnv = trimOrigin(process.env.APP_URL);
  if (fromEnv.startsWith("https://") && !isLocalOrigin(fromEnv)) {
    return fromEnv;
  }

  const vercelHost = trimOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL).replace(
    /^https?:\/\//,
    "",
  );
  if (vercelHost) return `https://${vercelHost}`;

  if (requestUrl) {
    const origin = new URL(requestUrl).origin;
    if (!isLocalOrigin(origin)) return origin;
  }

  return PRODUCTION_URL;
}
