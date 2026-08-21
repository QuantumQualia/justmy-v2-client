import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow HMR when opening the app via 127.0.0.1 instead of localhost
  allowedDevOrigins: ["127.0.0.1"],
  // pnpm hoists next under the workspace root; Turbopack must search from there
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
  transpilePackages: ["@workspace/ui", "@workspace/asksky-embed", "@workspace/myform-embed"],
  // Evict Turbopack's in-memory cache to disk so long `next dev` sessions
  // do not grow until OOM (this app previously hit ~12GB on 16.2).
  experimental: {
    turbopackMemoryEviction: "full",
  },
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
