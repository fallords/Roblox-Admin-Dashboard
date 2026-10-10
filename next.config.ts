import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "same-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  // HSTS only makes sense over HTTPS; enable for production deployments.
  ...(isProduction ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }] : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Native modules must be loaded from node_modules at runtime, not bundled.
  serverExternalPackages: ["@node-rs/argon2", "better-sqlite3", "@prisma/adapter-better-sqlite3"],
  async headers() {
    // Pages are dynamically rendered (session cookie), so Next.js already sends
    // `Cache-Control: private, no-store` for them.
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
