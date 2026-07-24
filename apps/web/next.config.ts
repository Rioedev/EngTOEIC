import type { NextConfig } from "next";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";

// npm workspaces run Next.js with apps/web as cwd. Load the monorepo-level
// environment as a local fallback so web and API can share one root .env.
try {
  loadEnvFile(resolve(process.cwd(), "../../.env"));
} catch (error) {
  const code =
    error instanceof Error && "code" in error ? error.code : undefined;

  if (code !== "ENOENT") {
    throw error;
  }
}

const nextConfig: NextConfig = {
  // Keep the development compiler cache separate from production builds.
  // Running `next build` while `next dev` is open can otherwise mix manifests
  // and cause runtime errors such as a missing `/_app` entry.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  transpilePackages: ["@engtoeic/shared"],
  env: {
    // These two values are intentionally browser-visible. Never map the
    // Supabase secret/service-role key here.
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.SUPABASE_PUBLISHABLE_KEY,
  },
};

export default nextConfig;
