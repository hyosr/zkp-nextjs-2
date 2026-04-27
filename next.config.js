/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env.ZKP_API_URL || 'http://localhost:8001'}/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
