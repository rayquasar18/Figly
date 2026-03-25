const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@figly/shared'],
  outputFileTracingRoot: path.join(__dirname, '../'),
};

module.exports = nextConfig;
