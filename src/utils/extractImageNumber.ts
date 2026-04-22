export function extractImageNumber(url: string): number | null {
  try {
    const pathname = new URL(url).pathname;
    const last = pathname.split("/").pop();
    if (!last) return null;
    const n = Number(last);
    return Number.isNaN(n) ? null : n;
  } catch {
    return null;
  }
}
