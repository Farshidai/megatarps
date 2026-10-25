import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Serve WebP from the optimizer (AVIF encodes much slower on first request).
    formats: ['image/webp'],
    // Optimized images are content-addressed by URL; cache them for 30 days.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      // Legacy Shopify product photos still referenced by the catalog.
      { protocol: 'https', hostname: 'cdn.shopify.com', pathname: '/s/files/**' },
      // Supabase Storage (public buckets) for uploaded product images.
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/render/image/public/**' },
    ],
  },
};

export default nextConfig;
