import { cpSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(__dirname, "..");
const distFile = join(pkgRoot, "dist", "cityos.js");
const outDir = join(pkgRoot, "..", "..", "apps", "web", "public", "embed");
mkdirSync(outDir, { recursive: true });
cpSync(distFile, join(outDir, "cityos.js"), { force: true });
console.log("cityos-events-embed: copied dist/cityos.js -> apps/web/public/embed/cityos.js");
