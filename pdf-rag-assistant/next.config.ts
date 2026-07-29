import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide Next.js's development-only route/build indicator from the app UI.
  devIndicators: false,
  // Keep PDF.js outside Turbopack's server bundle so its sibling worker file
  // can be resolved from node_modules at runtime.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "tesseract.js"],
};

export default nextConfig;
