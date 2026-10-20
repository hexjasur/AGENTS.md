import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { installProject, updateProject, isValidVersion, getCurrentVersion } from '../lib/core.js';

async function withTempDir(run) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'agents-md-test-'));
  try { await run(dir); } finally { await rm(dir, { recursive: true, force: true }); }
}

test('version validator only accepts bounded semver-like versions', () => {
  assert.equal(isValidVersion('1.2.3'), true);
  assert.equal(isValidVersion('1.2.3-beta.1'), true);
  for (const version of ['', 'latest', '999999999999999999999.0.0', '../1.2.3', '1.2', 'v1.2.3', null]) assert.equal(isValidVersion(version), false);
});

test('install writes content and validated version/hash manifest', async () => withTempDir(async (dir) => {
  const result = await installProject(dir);
  assert.equal(result.status, 'installed');
  const manifest = JSON.parse(await readFile(path.join(dir, '.agents-md', 'installation.json'), 'utf8'));
  assert.equal(manifest.version, getCurrentVersion());
  assert.match(manifest.contentHash, /^[a-f0-9]{64}$/);
}));

test('existing file is not overwritten implicitly and tampering blocks update', async () => withTempDir(async (dir) => {
  await writeFile(path.join(dir, 'AGENTS.md'), 'user-owned');
  assert.equal((await installProject(dir)).status, 'exists');
  await assert.rejects(updateProject(dir), /manifesti topilmadi/);
}));

test('tampered installed content cannot be updated without force', async () => withTempDir(async (dir) => {
  await installProject(dir);
  await writeFile(path.join(dir, 'AGENTS.md'), 'edited by user');
  await assert.rejects(updateProject(dir), /o‘zgartirilgan/);
  assert.equal((await updateProject(dir, { force: true })).status, 'replaced');
}));

test('malformed manifest schema/version is rejected, never trusted', async () => withTempDir(async (dir) => {
  await mkdir(path.join(dir, '.agents-md'));
  await writeFile(path.join(dir, 'AGENTS.md'), 'user-owned');
  await writeFile(path.join(dir, '.agents-md', 'installation.json'), JSON.stringify({ schemaVersion: 1, version: '../nope', installedAt: new Date().toISOString(), contentHash: '0'.repeat(64) }));
  await assert.rejects(updateProject(dir), /sxemasi yoki versiyasi noto‘g‘ri/);
}));
