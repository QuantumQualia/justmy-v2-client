/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow HMR when opening the app via 127.0.0.1 instead of localhost
  allowedDevOrigins: ["127.0.0.1"],
  transpilePackages: ["@workspace/ui", "@workspace/asksky-embed", "@workspace/myform-embed"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
    ],
  },
}

export default nextConfig
