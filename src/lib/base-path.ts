// Set at build time when the site is served from a sub-path (GitHub Pages project site).
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBasePath(path: string) {
  return path.startsWith("/") ? basePath + path : path;
}
