/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip Next's auto-generated AGENTS.md / CLAUDE.md files.
  agentRules: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
    ],
  },
};

export default nextConfig;
