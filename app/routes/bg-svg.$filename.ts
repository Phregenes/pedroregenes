import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Route } from "./+types/bg-svg.$filename";

/**
 * Fallback for /bg-svg/<file>.svg that always reads straight from disk.
 * Vite normally serves public/ assets directly, but its dev-server cache of
 * "which files exist" only gets refreshed by the fs watcher — and on this
 * machine the watcher regularly hits EMFILE limits, so brand new SVGs
 * dropped into public/bg-svg can 404 until a restart. This route guarantees
 * new files show up immediately without needing to restart the dev server.
 */
export async function loader({ params }: Route.LoaderArgs) {
  const filename = params.filename ?? "";
  if (!filename.toLowerCase().endsWith(".svg") || filename.includes("/") || filename.includes("..")) {
    throw new Response("Not found", { status: 404 });
  }

  const filePath = path.join(process.cwd(), "public", "bg-svg", filename);
  try {
    const contents = await readFile(filePath, "utf-8");
    return new Response(contents, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-cache",
      },
    });
  } catch {
    throw new Response("Not found", { status: 404 });
  }
}
