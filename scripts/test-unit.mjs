import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "esbuild";

const directory = mkdtempSync(join(tmpdir(), "magazine-caze-tests-"));
const bundledTest = join(directory, "business.test.cjs");
try {
  await build({
    entryPoints: ["tests/business.test.ts"],
    outfile: bundledTest,
    bundle: true,
    platform: "node",
    conditions: ["react-server"],
  });
  const result = spawnSync(process.execPath, ["--test", "tests/env.test.mjs", bundledTest], { stdio: "inherit" });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(directory, { recursive: true, force: true });
}
