/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Tree-shake large packages — only import what's used
    optimizePackageImports: ["framer-motion", "@tanstack/react-query"],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      porto: false,
      "porto/internal": false,
      "@base-org/account": false,
      "@safe-global/safe-apps-sdk": false,
      "@safe-global/safe-apps-provider": false,
      "@metamask/connect-evm": false,
      "@farcaster/mini-app-solana": false,
    };
    return config;
  },
};

module.exports = nextConfig;
