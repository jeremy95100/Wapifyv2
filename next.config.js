/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['esbuild'],
  },
  webpack: (config, { isServer }) => {
    // Exclure esbuild du bundle client
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'esbuild': false,
      }
    }
    return config
  },
}

module.exports = nextConfig
