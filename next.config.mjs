import { redirects, securityHeaders } from './config/redirects.mjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // NOT a static export any more: the app has API routes and a database, so
  // it needs a Node runtime. Content pages are still prerendered at build
  // time (SSG), so the SEO position is unchanged — only /api/* and the
  // admin screens are dynamic.
  //
  // Deploy target is therefore Vercel or Render rather than a pure static
  // host. See DEPLOY.md.

  // Emit /about/index.html rather than /about.html so the CDN serves clean URLs.
  trailingSlash: true,

  // Pre-sized AVIF/WebP are shipped in /public, so the optimiser is not needed.
  images: { unoptimized: true },

  // This folder sits under a parent directory that also has a lockfile;
  // pin the tracing root so Next does not infer the wrong workspace.
  outputFileTracingRoot: import.meta.dirname,

  // 301s from the old site and the security headers. These previously lived
  // only in public/_headers and public/_redirects, which are Netlify syntax
  // and are inert on a Node host — see config/redirects.mjs.
  async redirects() {
    return redirects
  },

  async headers() {
    return securityHeaders
  },

  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
}

export default nextConfig
