#!/usr/bin/env node
// Validates that relative Markdown links resolve to files that exist.
// Offline by design: http(s), mailto, and pure #anchor links are skipped.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, normalize, extname, relative } from 'node:path';

const IGNORE_DIRS = new Set(['node_modules', '.git', '.remember', '.codex', 'dist', 'coverage']);
const linkPattern = /\]\(([^)]+)\)/g;

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      walk(join(dir, entry.name), acc);
    } else if (extname(entry.name) === '.md') {
      acc.push(join(dir, entry.name));
    }
  }
  return acc;
}

const root = process.cwd();
const files = walk(root);
let checked = 0;
const broken = [];

for (const file of files) {
  const dir = dirname(file);
  const text = readFileSync(file, 'utf8');
  for (const match of text.matchAll(linkPattern)) {
    const target = match[1].trim();
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    const path = target.split('#')[0];
    if (!path) continue;
    checked++;
    const full = normalize(join(dir, path));
    if (!existsSync(full)) {
      broken.push(`${relative(root, file)} -> ${target}`);
    }
  }
}

console.log(`check-links: ${checked} relative links checked across ${files.length} markdown files`);
if (broken.length > 0) {
  console.error('check-links: broken relative links:');
  for (const entry of broken) console.error(`  ${entry}`);
  process.exit(1);
}
console.log('check-links: OK, all relative links resolve');
