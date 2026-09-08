/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: every public page is prerendered to plain HTML at build time.
  // This is the core SEO decision — no server runtime, no DB query on page load.
  output: 'export',

  // Emit /about/index.html rather than /about.html so the CDN serves clean URLs.
  trailingSlash: true,

  // next/image optimisation needs a server, which a static export does not have.
  // We ship pre-sized AVIF/WebP in /public instead — see README, "Images".
  images: { unoptimized: true },

  // This folder sits under a parent directory that also has a lockfile;
  // pin the tracing root so Next does not infer the wrong workspace.
  outputFileTracingRoot: import.meta.dirname,

  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
}

export default nextConfig
