import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // @ts-ignore - allowedDevOrigins is required for Docker/Local IP access but might not be in the type definition
  allowedDevOrigins: ["192.168.1.103", "localhost:3000"]
};

export default nextConfig;
