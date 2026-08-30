import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Default is 1MB, too small for scanned document/photo uploads (KTP, KK,
    // ijazah, foto formal, bukti pembayaran, bukti kerja all go through
    // Server Actions as multipart/form-data). 10mb comfortably covers a
    // typical scanned PDF or phone-camera photo while still bounding
    // request size.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
