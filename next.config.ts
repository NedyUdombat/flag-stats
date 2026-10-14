import type { NextConfig } from "next";

const hostnames = ["res.cloudinary.com", "images.unsplash.com"];

const nextConfig: NextConfig = {
  /* config options here */

  images: {
    remotePatterns: hostnames.map((hostname) => ({
      protocol: "https",
      hostname,
    })),
  },
};

export default nextConfig;
