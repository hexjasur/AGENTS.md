#!/usr/bin/env node
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const markerStart = '<!-- SKILLS:BEGIN -->';
const markerEnd = '<!-- SKILLS:END -->';

function parseDescription(markdown, skillName) {
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(markdown)?.[1];
  if (!frontmatter) throw new Error(`${skillName}/SKILL.md is missing YAML frontmatter.`);
  const lines = frontmatter.split(/\r?\n/);
  const index = lines.findIndex((line) => /^description:\s*/.test(line));
  if (index < 0) throw new Error(`${skillName}/SKILL.md is missing a description.`);
  const firstLine = lines[index].replace(/^description:\s*/, '').trim();
  let description;
  if (firstLine === '>' || firstLine === '>-' || firstLine === '|') {
    const parts = [];
    for (const line of lines.slice(index + 1)) {
      if (line.trim() === '') continue;
      if (!/^\s+/.test(line)) break;
      parts.push(line.trim());
    }
    description = parts.join(' ');
  } else {
    description = firstLine.replace(/^['"]|['"]$/g, '');
  }
  return description.replaceAll('|', '\\|').replace(/\s+/g, ' ').trim();
}

async function buildTable() {
  const entries = (await readdir(path.join(root, 'skills'), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const rows = ['| Skill | Description |', '| --- | --- |'];
  for (const name of entries) {
    const content = await readFile(path.join(root, 'skills', name, 'SKILL.md'), 'utf8');
    rows.push(`| \`${name}\` | ${parseDescription(content, name)} |`);
  }
  return rows.join('\n');
}

function replaceBlock(document, table, filePath) {
  const start = document.indexOf(markerStart);
  const end = document.indexOf(markerEnd);
  if (start < 0 || end < start || document.indexOf(markerStart, start + markerStart.length) !== -1) {
    throw new Error(`${path.relative(root, filePath)} must contain exactly one valid generated-skill marker pair.`);
  }
  const before = document.slice(0, start + markerStart.length);
  const after = document.slice(end);
  return `${before}\n${table}\n${after}`;
}

async function main() {
  const checkOnly = process.argv.slice(2).includes('--check');
  if (process.argv.slice(2).some((arg) => arg !== '--check')) throw new Error('Only --check is supported.');
  const table = await buildTable();
  const files = ['AGENTS.md', 'README.md'];
  let stale = false;
  for (const name of files) {
    const filePath = path.join(root, name);
    const current = await readFile(filePath, 'utf8');
    const updated = replaceBlock(current, table, filePath);
    if (updated !== current) {
      stale = true;
      if (!checkOnly) await writeFile(filePath, updated);
      else console.error(`${name} skill index is out of date. Run npm run sync:skills.`);
    }
  }
  if (checkOnly && stale) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Unknown skill-index generation error.');
  process.exitCode = 1;
});
