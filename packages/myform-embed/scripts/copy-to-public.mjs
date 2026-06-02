import { cpSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(__dirname, "..");
const distFile = join(pkgRoot, "dist", "myform.js");
const outDir = join(pkgRoot, "..", "..", "apps", "web", "public", "embed");
mkdirSync(outDir, { recursive: true });
cpSync(distFile, join(outDir, "myform.js"), { force: true });
// eslint-disable-next-line no-console
console.log("myform-embed: copied dist/myform.js -> apps/web/public/embed/myform.js");
