import "./src/env.js";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pdf-parse", "postgres"],
  env: {
    NEXT_PUBLIC_BUILD_TIMESTAMP: new Date().toISOString(),
  },
};

export default nextConfig;
