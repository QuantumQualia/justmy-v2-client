import { cpSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(__dirname, "..");
const distFile = join(pkgRoot, "dist", "asksky.js");
const outDir = join(pkgRoot, "..", "..", "apps", "web", "public", "embed");
mkdirSync(outDir, { recursive: true });
cpSync(distFile, join(outDir, "asksky.js"), { force: true });
// eslint-disable-next-line no-console
console.log("asksky-embed: copied dist/asksky.js -> apps/web/public/embed/asksky.js");
