#!/usr/bin/env node
import { buildReportFile } from './render.mjs';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

const defaultInput = 'docs/evidence/job-hunter-runs/latest.json';
const defaultOutput = 'docs/index.html';

const args = process.argv.slice(2);
const inputPath = args[0] || defaultInput;
const outputPath = args[1] || defaultOutput;

try {
  console.log(`[presentation] Generating Executive Vacancy Review dashboard...`);
  console.log(`  Input Snapshot: ${resolve(inputPath)}`);
  console.log(`  Output HTML:   ${resolve(outputPath)}`);

  if (!existsSync(resolve(inputPath))) {
    console.error(`[presentation] ERROR: Input file not found at ${inputPath}`);
    process.exit(1);
  }

  const result = buildReportFile(inputPath, outputPath);
  console.log(`[presentation] SUCCESS: HTML Dashboard generated at ${result.resolvedOutput}`);
} catch (err) {
  console.error(`[presentation] ERROR generating presentation:`, err);
  process.exit(1);
}
