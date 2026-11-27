import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "esbuild";

const directory = mkdtempSync(join(tmpdir(), "magazine-caze-tests-"));
const bundledTests = ["business", "security"].map((name) => join(directory, name + ".test.js"));
try {
  await build({
    entryPoints: ["tests/business.test.ts", "tests/security.test.ts"],
    outdir: directory,
    bundle: true,
    platform: "node",
    conditions: ["react-server"],
  });
  const result = spawnSync(process.execPath, ["--test", "tests/env.test.mjs", ...bundledTests], { stdio: "inherit" });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(directory, { recursive: true, force: true });
}
