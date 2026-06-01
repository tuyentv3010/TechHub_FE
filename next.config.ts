import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import bundleAnalyzer from '@next/bundle-analyzer';

const withNextIntl = createNextIntlPlugin();

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const buildRemotePatterns = () => {
  const patterns: NonNullable<NextConfig['images']>['remotePatterns'] = [
    {
      protocol: 'https',
      hostname: 'res.cloudinary.com',
      port: '',
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: 'images.unsplash.com',
      port: '',
      pathname: '/**',
    },
    {
      protocol: 'http',
      hostname: 'localhost',
      port: '9000',
      pathname: '/**',
    },
    {
      protocol: 'http',
      hostname: '127.0.0.1',
      port: '9000',
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: 'minio-api.inova.id.vn',
      port: '',
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: 'minio.inova.id.vn',
      port: '',
      pathname: '/**',
    },
  ];

  const publicUrl = process.env.NEXT_PUBLIC_MINIO_PUBLIC_URL;

  if (publicUrl) {
    try {
      const parsedUrl = new URL(publicUrl);
      patterns.push({
        protocol: parsedUrl.protocol.replace(':', '') as 'http' | 'https',
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        pathname: `${parsedUrl.pathname.replace(/\/$/, '') || ''}/**`,
      });
    } catch {
      // Ignore invalid public URL and keep default image hosts.
    }
  }

  return patterns;
};

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // Server-side image optimization (/_next/image) requires the Next
    // server to fetch every remote source itself. On the deployed VPS that
    // fails for two reasons: (1) the container has no/limited outbound
    // egress so Unsplash images can't be fetched, and (2) the optimizer
    // does not forward the user's auth cookie, so authenticated MinIO proxy
    // thumbnails return 401. Disabling optimization makes the browser load
    // each `src` directly (it has internet + sends cookies), fixing both.
    unoptimized: true,
    remotePatterns: buildRemotePatterns(),
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
