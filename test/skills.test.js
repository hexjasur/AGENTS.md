import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skillsRoot = path.join(root, 'skills');

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  assert.ok(match, 'SKILL.md must start with YAML frontmatter');
  const fields = new Map();
  for (const line of match[1].split(/\r?\n/)) {
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

async function listSkills() {
  return (await readdir(skillsRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

test('descriptions say what the skill does and when to use it', async () => {
  for (const name of await listSkills()) {
    const content = await readFile(path.join(skillsRoot, name, 'SKILL.md'), 'utf8');
    const fields = parseFrontmatter(content);
    assert.ok(fields.get('name').length <= 64, `${name}: name too long`);
    assert.match(fields.get('description'), /\bUse (?:when|for)\b/, `${name}: description needs a "Use when/for" trigger`);
    assert.ok(content.split('\n').length <= 500, `${name}: SKILL.md must stay under 500 lines`);
  }
});

test('every reference file is linked from SKILL.md and every relative link resolves', async () => {
  for (const name of await listSkills()) {
    const skillPath = path.join(skillsRoot, name);
    const content = await readFile(path.join(skillPath, 'SKILL.md'), 'utf8');
    let references = [];
    try {
      references = (await readdir(path.join(skillPath, 'references'))).sort();
    } catch (error) {
      assert.equal(error.code, 'ENOENT');
    }
    for (const reference of references) {
      assert.ok(content.includes(`references/${reference}`), `${name}: references/${reference} is not linked from SKILL.md`);
    }
    for (const match of content.matchAll(/`(references\/[A-Za-z0-9._-]+)`/g)) {
      await stat(path.join(skillPath, match[1]));
    }
  }
});

test('skills and AGENTS.md carry no secrets or machine-specific paths', async () => {
  const files = [path.join(root, 'AGENTS.md')];
  for (const name of await listSkills()) {
    const skillPath = path.join(skillsRoot, name);
    files.push(path.join(skillPath, 'SKILL.md'));
    try {
      for (const reference of await readdir(path.join(skillPath, 'references'))) files.push(path.join(skillPath, 'references', reference));
    } catch (error) {
      assert.equal(error.code, 'ENOENT');
    }
  }
  for (const file of files) {
    const content = await readFile(file, 'utf8');
    assert.doesNotMatch(content, /(?:ghp_|github_pat_|sk-[A-Za-z0-9]{20}|AKIA[0-9A-Z]{16})/, `${file}: looks like a secret`);
    assert.doesNotMatch(content, /(?:\/home\/[a-z]|\/Users\/[A-Za-z]|C:\\Users\\)/, `${file}: machine-specific path`);
  }
});

test('AGENTS.md version matches package.json', async () => {
  const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  const agents = await readFile(path.join(root, 'AGENTS.md'), 'utf8');
  assert.match(agents, new RegExp(`^Version: ${pkg.version.replace(/\./g, '\\.')}$`, 'm'));
});
