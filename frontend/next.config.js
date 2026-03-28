/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@figly/shared'],
};

module.exports = nextConfig;
