import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

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

test('README release download version matches package.json', async () => {
  const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  const readme = await readFile(path.join(root, 'README.md'), 'utf8');
  const version = /^VERSION=(.+)$/m.exec(readme)?.[1];
  assert.equal(version, pkg.version, 'README download example must target the current package version');
});

test('skill catalogs are generated and stay synchronized across AGENTS.md and README', () => {
  const result = spawnSync(process.execPath, [path.join(root, 'bin', 'sync-skill-index.js'), '--check'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
});

test('AGENTS.md omits duplicated version and founder metadata', async () => {
  const agents = await readFile(path.join(root, 'AGENTS.md'), 'utf8');
  assert.doesNotMatch(agents, /^Version:/m);
  assert.doesNotMatch(agents, /^Founder:/m);
});

test('.gitignore excludes dotenv files without hiding similarly named source files', () => {
  const isIgnored = (file) => spawnSync('git', ['check-ignore', '-q', '--no-index', file], { cwd: root }).status === 0;
  assert.equal(isIgnored('.env'), true);
  assert.equal(isIgnored('.env.local'), true);
  assert.equal(isIgnored('.env.example'), false);
  assert.equal(isIgnored('env.d.ts'), false);
  assert.equal(isIgnored('environments/config.ts'), false);
});

test('every skill has an eval file with positive, edge, and negative prompts', async () => {
  const evalsRoot = path.join(root, 'evals');
  const skills = (await readdir(skillsRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  const evalFiles = (await readdir(evalsRoot)).filter((file) => file.endsWith('.json')).map((file) => file.replace(/\.json$/, '')).sort();
  assert.deepEqual(evalFiles, skills, 'evals/ must contain exactly one <skill>.json per skill');

  for (const skill of skills) {
    const data = JSON.parse(await readFile(path.join(evalsRoot, `${skill}.json`), 'utf8'));
    assert.equal(data.skill, skill);
    assert.ok(Array.isArray(data.evals) && data.evals.length >= 3, `${skill}: needs at least 3 eval prompts`);
    const ids = new Set();
    for (const item of data.evals) {
      assert.ok(typeof item.id === 'string' && !ids.has(item.id), `${skill}: eval ids must be unique`);
      ids.add(item.id);
      assert.ok(typeof item.prompt === 'string' && item.prompt.length > 10, `${skill}/${item.id}: prompt required`);
      assert.equal(typeof item.should_trigger, 'boolean');
      assert.ok(Array.isArray(item.assertions) && item.assertions.length >= 1, `${skill}/${item.id}: assertions required`);
    }
    assert.ok(data.evals.some((item) => item.should_trigger === false), `${skill}: needs a negative prompt`);
    assert.ok(data.evals.filter((item) => item.should_trigger).length >= 2, `${skill}: needs at least 2 positive prompts`);
  }
});

test('AGENTS.md and README list every bundled skill', async () => {
  const skills = (await readdir(skillsRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  const agents = await readFile(path.join(root, 'AGENTS.md'), 'utf8');
  const readme = await readFile(path.join(root, 'README.md'), 'utf8');
  for (const skill of skills) {
    assert.ok(agents.includes(`\`${skill}\``), `AGENTS.md is missing ${skill}`);
    assert.ok(readme.includes(skill), `README.md is missing ${skill}`);
  }
});

test('community files exist', async () => {
  for (const file of ['CONTRIBUTING.md', 'SECURITY.md', 'CODE_OF_CONDUCT.md', 'CHANGELOG.md', '.github/workflows/ci.yml', '.github/dependabot.yml', '.github/pull_request_template.md']) {
    assert.equal((await stat(path.join(root, file))).isFile(), true, `${file} is missing`);
  }
});
