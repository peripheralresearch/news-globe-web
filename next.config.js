/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'objectstorage.ap-melbourne-1.oraclecloud.com',
        pathname: '/n/axxt2lb4tgkv/b/eventhorizon-sentinel-media-mel01/**',
      },
    ],
  },
}

module.exports = nextConfig