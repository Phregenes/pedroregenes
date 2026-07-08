import { readdir } from "node:fs/promises";
import path from "node:path";

/**
 * Resource route that lists every SVG dropped into public/bg-svg, so the
 * interactive drawing can pick them all up without hardcoding filenames.
 */
export async function loader() {
  const dir = path.join(process.cwd(), "public", "bg-svg");
  let files: string[] = [];
  try {
    const entries = await readdir(dir);
    files = entries
      .filter((f) => f.toLowerCase().endsWith(".svg"))
      .sort()
      .map((f) => `/bg-svg/${f}`);
  } catch {
    files = [];
  }
  return Response.json({ files });
}
