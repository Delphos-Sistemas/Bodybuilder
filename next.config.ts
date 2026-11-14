import type { NextConfig } from "next";

// Exportação estática: todo o app roda no navegador (dados locais),
// então o build gera HTML/JS/CSS puros em ./out, servidos como assets estáticos na Cloudflare.
const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: true,
  images: { unoptimized: true },
  outputFileTracingRoot: __dirname
};

export default nextConfig;
