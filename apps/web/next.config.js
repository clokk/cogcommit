/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@cogcommit/types", "@cogcommit/supabase", "@cogcommit/ui"],
};

module.exports = nextConfig;
