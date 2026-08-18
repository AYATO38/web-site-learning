import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.trycloudflare.com"],
  serverExternalPackages: ["nodemailer"],
};

export default nextConfig;
