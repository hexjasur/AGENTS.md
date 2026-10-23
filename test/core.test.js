import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile, mkdir, rename } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { installProject, installMissingSkills, updateProject, isValidVersion, getCurrentVersion } from '../lib/core.js';

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
  assert.ok(result.skills.installed.includes('repo-quality'));
  assert.match(await readFile(path.join(dir, '.agent', 'skills', 'repo-quality', 'SKILL.md'), 'utf8'), /^---/);
  assert.match(await readFile(path.join(dir, '.agent', 'skills', 'web-security', 'references', 'security.md'), 'utf8'), /security/i);
  const manifest = JSON.parse(await readFile(path.join(dir, '.agent', 'hexjasurs.agent.scheme.json'), 'utf8'));
  assert.equal(manifest.version, getCurrentVersion());
  assert.match(manifest.contentHash, /^[a-f0-9]{64}$/);
  await assert.rejects(readFile(path.join(dir, '.agents-md', 'installation.json')), { code: 'ENOENT' });
}));

test('install adds missing skills without overwriting existing skill directories', async () => withTempDir(async (dir) => {
  await installProject(dir);
  const customSkillFile = path.join(dir, '.agent', 'skills', 'repo-quality', 'SKILL.md');
  await writeFile(customSkillFile, 'customized by user');

  const result = await installProject(dir, { replaceExisting: true, force: true });

  assert.ok(result.skills.skipped.includes('repo-quality'));
  assert.equal(await readFile(customSkillFile, 'utf8'), 'customized by user');
  assert.match(await readFile(path.join(dir, '.agent', 'skills', 'web-performance', 'SKILL.md'), 'utf8'), /^---/);
}));

test('existing file is not overwritten implicitly and tampering blocks update', async () => withTempDir(async (dir) => {
  await writeFile(path.join(dir, 'AGENTS.md'), 'user-owned');
  assert.equal((await installProject(dir)).status, 'exists');
  await assert.rejects(updateProject(dir), /Installation manifest not found/);
}));

test('installing missing skills preserves an existing AGENTS.md', async () => withTempDir(async (dir) => {
  const agentsFile = path.join(dir, 'AGENTS.md');
  await writeFile(agentsFile, 'user-owned instructions');

  const result = await installMissingSkills(dir);

  assert.equal(result.status, 'kept');
  assert.equal(await readFile(agentsFile, 'utf8'), 'user-owned instructions');
  assert.match(await readFile(path.join(dir, '.agent', 'skills', 'repo-quality', 'SKILL.md'), 'utf8'), /^---/);
  await assert.rejects(readFile(path.join(dir, '.agent', 'hexjasurs.agent.scheme.json')), { code: 'ENOENT' });
}));

test('tampered installed content cannot be updated without force', async () => withTempDir(async (dir) => {
  await installProject(dir);
  await writeFile(path.join(dir, 'AGENTS.md'), 'edited by user');
  await assert.rejects(updateProject(dir), /was modified/);
  assert.equal((await updateProject(dir, { force: true })).status, 'replaced');
}));

test('update migrates the legacy manifest into the agent scheme location', async () => withTempDir(async (dir) => {
  await installProject(dir);
  const currentManifest = path.join(dir, '.agent', 'hexjasurs.agent.scheme.json');
  const legacyDirectory = path.join(dir, '.agents-md');
  await mkdir(legacyDirectory);
  await rename(currentManifest, path.join(legacyDirectory, 'installation.json'));

  assert.equal((await updateProject(dir)).status, 'replaced');
  const migratedManifest = JSON.parse(await readFile(currentManifest, 'utf8'));
  assert.equal(migratedManifest.version, getCurrentVersion());
  await assert.rejects(readFile(path.join(legacyDirectory, 'installation.json')), { code: 'ENOENT' });
  assert.equal((await readdir(dir)).includes('.agents-md'), false);
}));

test('malformed manifest schema/version is rejected, never trusted', async () => withTempDir(async (dir) => {
  await mkdir(path.join(dir, '.agents-md'));
  await writeFile(path.join(dir, 'AGENTS.md'), 'user-owned');
  await writeFile(path.join(dir, '.agents-md', 'installation.json'), JSON.stringify({ schemaVersion: 1, version: '../nope', installedAt: new Date().toISOString(), contentHash: '0'.repeat(64) }));
  await assert.rejects(updateProject(dir), /schema or version is invalid/);
}));
