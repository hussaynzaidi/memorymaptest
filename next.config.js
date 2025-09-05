/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure images to allow external domains for map tiles
  images: {
    domains: ['server.arcgisonline.com'],
  },
}

module.exports = nextConfig 