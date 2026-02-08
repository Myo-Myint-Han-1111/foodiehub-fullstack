import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "mitziemee.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.deliveryhero.io",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lionmartjp.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "encrypted-tbn0.gstatic.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i0.wp.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.saveur.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "shop.shwebiz.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "smartcdn.gprod.postmedia.digital",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.squarespace-cdn.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.tasteatlas.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "myanmarmix.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cookiecompanion.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.seingayhar.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.google.com",
        port: "",
        pathname: "/**",
      },
      // ✅ NEW: Blogger images
      {
        protocol: "https",
        hostname: "blogger.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      // Wildcard patterns for flexibility
      {
        protocol: "https",
        hostname: "**.gstatic.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.wp.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
