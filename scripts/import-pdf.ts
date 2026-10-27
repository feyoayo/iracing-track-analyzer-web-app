// Usage: bun scripts/import-pdf.ts <schedule.pdf> [--season "2026 Season 4"]
// Runs parse.py + export_web_data.py from the analyzer repo and writes JSON into ./data.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const analyzerDir = path.resolve(
  process.env.ANALYZER_DIR ?? path.join(webRoot, "..", "iracing-track-analyzer"),
);

const args = process.argv.slice(2);
const pdfArg = args.find((a) => !a.startsWith("--"));
const seasonIdx = args.indexOf("--season");
const seasonArg = seasonIdx >= 0 ? args[seasonIdx + 1] : undefined;

function fail(message: string): never {
  console.error(`[import-pdf] ${message}`);
  process.exit(1);
}

function seasonFromFilename(file: string): string | undefined {
  const match = /^(\d{4})s(\d+)/i.exec(path.basename(file));
  return match ? `${match[1]} Season ${Number(match[2])}` : undefined;
}

if (!pdfArg) fail('usage: bun scripts/import-pdf.ts <schedule.pdf> [--season "2026 Season 4"]');
const pdfPath = path.resolve(pdfArg);
if (!existsSync(pdfPath)) fail(`PDF not found: ${pdfPath}`);
if (!existsSync(path.join(analyzerDir, "parse.py"))) {
  fail(`analyzer repo not found at ${analyzerDir} (set ANALYZER_DIR)`);
}

const season = seasonArg ?? seasonFromFilename(pdfPath);
if (!season) fail(`cannot derive season from "${path.basename(pdfPath)}", pass --season`);

const venvPython = path.join(analyzerDir, "venv", "bin", "python");
const python = existsSync(venvPython) ? venvPython : "python3";

function run(script: string, scriptArgs: string[]): void {
  console.log(`[import-pdf] ${script} ${scriptArgs.join(" ")}`);
  const result = spawnSync(python, [script, ...scriptArgs], { cwd: analyzerDir, stdio: "inherit" });
  if (result.status !== 0) fail(`${script} failed (exit ${result.status ?? result.error?.message})`);
}

run("parse.py", ["--pdf", pdfPath, "--season", season, "--verbose"]);
run("export_web_data.py", ["--out", path.join(webRoot, "data")]);
console.log(`[import-pdf] done: ${season} → ${path.join(webRoot, "data")}`);
