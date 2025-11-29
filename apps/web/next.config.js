/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [],
  // Remove 'standalone' output for Vercel deployment
  // output: 'standalone', // Only needed for Docker/self-hosting
};

module.exports = nextConfig;

