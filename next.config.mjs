/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // better-sqlite3 é uma dependência nativa (compilada) — isso avisa o Next
  // para não tentar "empacotá-la" com o resto do código, e sim usá-la direto.
  serverExternalPackages: ["better-sqlite3"],
}

export default nextConfig
