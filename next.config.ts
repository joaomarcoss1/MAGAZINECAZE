import type { NextConfig } from "next";

import { validateEnv } from "./src/lib/env";

import { imageRemotePatterns } from "./src/lib/catalog/image-origins";
import { securityHeaders } from "./src/lib/security/headers";

validateEnv(process.env);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: imageRemotePatterns(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_CATALOG_IMAGE_ORIGINS),
    formats: ["image/avif", "image/webp"],
    maximumRedirects: 0,
  },
  experimental: { serverActions: { bodySizeLimit: "3mb" } },
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
