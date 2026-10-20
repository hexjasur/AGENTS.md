import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile, symlink } from 'node:fs/promises';
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
  const first = spawnSync(process.execPath, [cli, 'init', dir], { encoding: 'utf8' });
  assert.equal(first.status, 0, first.stderr);
  assert.match(first.stdout, /installed/);
  const original = await readFile(path.join(dir, 'AGENTS.md'), 'utf8');
  const second = spawnSync(process.execPath, [cli, 'init', dir], { input: '\n', encoding: 'utf8' });
  assert.equal(second.status, 0, second.stderr);
  assert.match(second.stdout, /Bekor qilindi/);
  assert.equal(await readFile(path.join(dir, 'AGENTS.md'), 'utf8'), original);
}));

test('CLI explicitly replacing an existing file records a fresh manifest', async () => withTempDir(async (dir) => {
  await writeFile(path.join(dir, 'AGENTS.md'), 'custom rules');
  const result = spawnSync(process.execPath, [cli, 'init', dir], { input: 'r\n', encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /replaced/);
  assert.match(await readFile(path.join(dir, 'AGENTS.md'), 'utf8'), /^# AGENTS\.md/m);
}));

test('install refuses metadata directory symlinks', async () => withTempDir(async (dir) => {
  const outside = await mkdtemp(path.join(os.tmpdir(), 'agents-md-outside-'));
  try {
    await symlink(outside, path.join(dir, '.agents-md'));
    const result = spawnSync(process.execPath, [cli, 'init', dir], { encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /manifest papkasi/);
    assert.deepEqual(await (await import('node:fs/promises')).readdir(outside), []);
  } finally { await rm(outside, { recursive: true, force: true }); }
}));
