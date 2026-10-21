import { readFile, writeFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { gt, inc, valid } from "semver";

async function readDatabase(path: string) {
  const data = JSON.parse(await readFile(path, "utf-8"));
  if (
    !data ||
    !Array.isArray(data.packages) ||
    !data.packages.every((pkg: unknown) => pkg && typeof pkg === "object" && !Array.isArray(pkg)) ||
    !Array.isArray(data.categories) ||
    !data.categories.every((category: unknown) => typeof category === "string") ||
    typeof data.version !== "string" ||
    !valid(data.version)
  ) {
    throw new Error(`Invalid registry data in ${path}`);
  }
  return data;
}

const publishedPath = process.argv[2];
if (!publishedPath || process.argv.length !== 3) {
  throw new Error(
    "Usage: node --experimental-strip-types lib/prepare-release.ts <published-db.json>",
  );
}

const published = await readDatabase(publishedPath);
const local = await readDatabase("db.json");
const manifest = JSON.parse(await readFile("package.json", "utf-8"));
if (typeof manifest.version !== "string" || !valid(manifest.version)) {
  throw new Error("Invalid version in package.json");
}

if (
  !isDeepStrictEqual(local.packages, published.packages) ||
  !isDeepStrictEqual(local.categories, published.categories)
) {
  const version = gt(manifest.version, published.version)
    ? manifest.version
    : inc(published.version, "patch")!;
  manifest.version = version;
  await writeFile("package.json", `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(version);
}
