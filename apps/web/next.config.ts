import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Monorepo root (…/Aida). Stops Turbopack from picking another `package-lock.json` up the tree. */
const monorepoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const nextConfig: NextConfig = {
  transpilePackages: ["@aida/shared"],
  turbopack: { root: monorepoRoot },
};

export default nextConfig;
