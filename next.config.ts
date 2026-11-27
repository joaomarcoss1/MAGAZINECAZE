import type { NextConfig } from "next";

import { validateEnv } from "./src/lib/env";

import { securityHeaders } from "./src/lib/security/headers";

validateEnv(process.env);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders(process.env),
      },
    ];
  },
};

export default nextConfig;
