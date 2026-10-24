import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm, writeFile, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(root, 'bin', 'cli.js');

async function withTempDir(run) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'agents-md-cli-test-'));
  try { await run(dir); } finally { await rm(dir, { recursive: true, force: true }); }
}

test('CLI initializes in a selected directory and default prompt cancels', async () => withTempDir(async (dir) => {
  const first = spawnSync(process.execPath, [cli, 'init', dir], { input: 'y\n', encoding: 'utf8' });
  assert.equal(first.status, 0, first.stderr);
  assert.match(first.stdout, /installed/);
  assert.match(first.stdout, /Installed skills:/);
  assert.match(first.stdout, /Included skills: .*repo-quality/);
  assert.match(first.stdout, /Install targets: AGENTS\.md and \.agent\/skills/);
  const original = await readFile(path.join(dir, 'AGENTS.md'), 'utf8');
  const second = spawnSync(process.execPath, [cli, 'init', dir], { input: 'y\n\n', encoding: 'utf8' });
  assert.equal(second.status, 0, second.stderr);
  assert.match(second.stdout, /kept/);
  assert.equal(await readFile(path.join(dir, 'AGENTS.md'), 'utf8'), original);
}));

test('CLI declines installation without creating project files', async () => withTempDir(async (dir) => {
  const result = spawnSync(process.execPath, [cli, dir], { input: 'n\n', encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /no files were installed/);
  await assert.rejects(readFile(path.join(dir, 'AGENTS.md')), { code: 'ENOENT' });
  await assert.rejects(readFile(path.join(dir, '.agent', 'skills', 'repo-quality', 'SKILL.md')), { code: 'ENOENT' });
}));

test('CLI defaults to no when the install confirmation is left blank', async () => withTempDir(async (dir) => {
  const result = spawnSync(process.execPath, [cli, dir], { input: '\n', encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /no files were installed/);
  await assert.rejects(readFile(path.join(dir, 'AGENTS.md')), { code: 'ENOENT' });
}));

test('CLI --yes installs without the initial confirmation prompt', async () => withTempDir(async (dir) => {
  const result = spawnSync(process.execPath, [cli, 'init', dir, '--yes'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stdout, /Continue with installation/);
  assert.match(await readFile(path.join(dir, '.agent', 'skills', 'repo-quality', 'SKILL.md'), 'utf8'), /^---/);
}));

test('CLI --yes keeps an existing AGENTS.md and adds skills without prompting', async () => withTempDir(async (dir) => {
  const agentsFile = path.join(dir, 'AGENTS.md');
  await writeFile(agentsFile, 'user-owned instructions');
  const result = spawnSync(process.execPath, [cli, dir, '--yes'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stdout, /Continue with installation|AGENTS\.md exists/);
  assert.equal(await readFile(agentsFile, 'utf8'), 'user-owned instructions');
  assert.match(await readFile(path.join(dir, '.agent', 'skills', 'repo-quality', 'SKILL.md'), 'utf8'), /^---/);
}));

test('CLI help describes commands and options in English', () => {
  const result = spawnSync(process.execPath, [cli, '--help'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /USAGE:/);
  assert.match(result.stdout, /COMMANDS:/);
  assert.match(result.stdout, /OPTIONS:/);
  assert.match(result.stdout, /--yes/);
  assert.match(result.stdout, /keeps it and installs missing skills by default/);
});

test('CLI explicitly replacing an existing file records a fresh manifest', async () => withTempDir(async (dir) => {
  await writeFile(path.join(dir, 'AGENTS.md'), 'custom rules');
  const result = spawnSync(process.execPath, [cli, 'init', dir], { input: 'y\nr\n', encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /replaced/);
  assert.match(await readFile(path.join(dir, 'AGENTS.md'), 'utf8'), /^# AGENTS\.md/m);
}));

test('install refuses scheme directory symlinks', async () => withTempDir(async (dir) => {
  const outside = await mkdtemp(path.join(os.tmpdir(), 'agents-md-outside-'));
  try {
    await symlink(outside, path.join(dir, '.agent'));
    const result = spawnSync(process.execPath, [cli, 'init', dir], { input: 'y\n', encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /manifest path must be a regular directory/);
    assert.deepEqual(await (await import('node:fs/promises')).readdir(outside), []);
  } finally { await rm(outside, { recursive: true, force: true }); }
}));

test('CLI --list-skills prints every bundled skill', () => {
  const result = spawnSync(process.execPath, [cli, '--list-skills'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  for (const name of ['tauri-auto-update', 'renpy-visual-novel', 'react-typescript', 'github-actions']) {
    assert.match(result.stdout, new RegExp(`^${name}\\s`, 'm'));
  }
});

test('CLI --skills installs only the selected skills', async () => withTempDir(async (dir) => {
  const result = spawnSync(process.execPath, [cli, 'init', dir, '--yes', '--skills', 'tauri-auto-update,renpy-ui-screens'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Installed skills: tauri-auto-update, renpy-ui-screens|Installed skills: renpy-ui-screens, tauri-auto-update/);
  const installed = (await readdir(path.join(dir, '.agent', 'skills'))).sort();
  assert.deepEqual(installed, ['renpy-ui-screens', 'tauri-auto-update']);
  assert.match(await readFile(path.join(dir, '.agent', 'skills', 'tauri-auto-update', 'references', 'release-workflow.md'), 'utf8'), /Release workflow reference/);
}));

test('CLI --skills=all and --skills with "all" install every skill', async () => withTempDir(async (dir) => {
  const result = spawnSync(process.execPath, [cli, 'init', dir, '--yes', '--skills=all'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const installed = await readdir(path.join(dir, '.agent', 'skills'));
  assert.ok(installed.length >= 15);
}));

test('CLI rejects unknown skills and unknown options before writing anything', async () => withTempDir(async (dir) => {
  const unknownSkill = spawnSync(process.execPath, [cli, 'init', dir, '--yes', '--skills', 'does-not-exist'], { encoding: 'utf8' });
  assert.notEqual(unknownSkill.status, 0);
  assert.match(unknownSkill.stderr, /Unknown skill: does-not-exist/);
  const unknownOption = spawnSync(process.execPath, [cli, 'init', dir, '--yes', '--bogus'], { encoding: 'utf8' });
  assert.notEqual(unknownOption.status, 0);
  assert.match(unknownOption.stderr, /Unknown option: --bogus/);
  const missingValue = spawnSync(process.execPath, [cli, 'init', dir, '--skills'], { encoding: 'utf8' });
  assert.notEqual(missingValue.status, 0);
  assert.match(missingValue.stderr, /--skills needs/);
  assert.deepEqual(await readdir(dir), []);
}));

test('CLI rejects path-like skill names', async () => withTempDir(async (dir) => {
  const result = spawnSync(process.execPath, [cli, 'init', dir, '--yes', '--skills', '../outside'], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unknown skill/);
  assert.deepEqual(await readdir(dir), []);
}));
