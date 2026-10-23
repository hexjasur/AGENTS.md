import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skillsRoot = path.join(root, 'skills');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(match, 'SKILL.md must start with YAML frontmatter');
  const fields = new Map();
  for (const line of match[1].split('\n')) {
    const field = line.match(/^([a-z-]+):\s*(.*)$/);
    if (field) fields.set(field[1], field[2].replace(/^['"]|['"]$/g, ''));
  }
  return fields;
}

test('every bundled skill follows the required metadata contract', async () => {
  const entries = (await readdir(skillsRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert.ok(entries.length >= 5);

  for (const name of entries) {
    const skillPath = path.join(skillsRoot, name);
    const skillFile = path.join(skillPath, 'SKILL.md');
    const content = await readFile(skillFile, 'utf8');
    const fields = parseFrontmatter(content);
    assert.equal(fields.get('name'), name);
    assert.ok(fields.get('description')?.length >= 1);
    assert.ok(fields.get('description')?.length <= 1024);
    assert.match(name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(content.length > 300);
  }
});

test('skill references stay inside their skill directory', async () => {
  const entries = (await readdir(skillsRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory());
  for (const entry of entries) {
    const referencesPath = path.join(skillsRoot, entry.name, 'references');
    try {
      const references = await readdir(referencesPath, { withFileTypes: true });
      for (const reference of references) {
        assert.equal(reference.isSymbolicLink(), false);
        assert.equal((await stat(path.join(referencesPath, reference.name))).isFile(), true);
      }
    } catch (error) {
      assert.equal(error.code, 'ENOENT');
    }
  }
});
