import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.trycloudflare.com"],
  serverExternalPackages: ["nodemailer"],
  // Next.js の開発用バッジ（左下の N）。アプリ本体には不要。
  devIndicators: false,
};

export default nextConfig;
