import { lstat, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ADAPTERS = {
  claude: {
    name: 'claude',
    directories: [],
    filename: 'CLAUDE.md',
    content: '@AGENTS.md\n'
  },
  cursor: {
    name: 'cursor',
    directories: ['.cursor', 'rules'],
    filename: 'agents-md.mdc',
    content: '---\ndescription: Follow the repository-wide AGENTS.md instructions\nalwaysApply: true\n---\n\n@AGENTS.md\n'
  },
  copilot: {
    name: 'copilot',
    directories: ['.github'],
    filename: 'copilot-instructions.md',
    content: '# Repository instructions\n\nThe canonical project instructions are in the repository-root [AGENTS.md](../AGENTS.md). Read and follow them before making changes. Do not duplicate or override those rules here.\n'
  }
};

function isMissing(error) {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

async function ensureSafeDirectories(root, directories) {
  let current = root;
  for (const segment of directories) {
    current = path.join(current, segment);
    try {
      await mkdir(current);
    } catch (error) {
      if (!(error instanceof Error) || !('code' in error) || error.code !== 'EEXIST') throw error;
    }
    const info = await lstat(current);
    if (info.isSymbolicLink() || !info.isDirectory()) {
      throw new Error(`Security error: agent adapter directory must not be a symbolic link: ${current}`);
    }
  }
  return current;
}

export function resolveAgentSelection(names) {
  if (names === undefined) return [];
  const requested = [...new Set(names.map((name) => name.trim().toLowerCase()).filter(Boolean))];
  if (requested.length === 0) throw new Error('--agents needs one or more supported names, or "all".');
  if (requested.includes('all')) {
    if (requested.length > 1) throw new Error('--agents all cannot be combined with individual names.');
    return Object.keys(ADAPTERS);
  }
  const unknown = requested.filter((name) => !Object.hasOwn(ADAPTERS, name));
  if (unknown.length > 0) throw new Error(`Unknown agent adapter${unknown.length > 1 ? 's' : ''}: ${unknown.join(', ')}. Choose: ${Object.keys(ADAPTERS).join(', ')}.`);
  return requested;
}

export async function installAgentAdapters(projectRoot, selection = []) {
  const root = path.resolve(projectRoot);
  const rootInfo = await lstat(root);
  if (rootInfo.isSymbolicLink() || !rootInfo.isDirectory()) {
    throw new Error(`Security error: project root must be a regular directory: ${root}`);
  }
  const installed = [];
  const skipped = [];
  for (const name of selection) {
    const adapter = ADAPTERS[name];
    if (!adapter) throw new Error(`Unsupported agent adapter: ${name}`);
    const directory = await ensureSafeDirectories(root, adapter.directories);
    const target = path.join(directory, adapter.filename);
    try {
      const info = await lstat(target);
      if (info.isSymbolicLink() || !info.isFile()) {
        throw new Error(`Security error: agent adapter target must be a regular file: ${target}`);
      }
      skipped.push(name);
      continue;
    } catch (error) {
      if (!isMissing(error)) throw error;
    }
    try {
      await writeFile(target, adapter.content, { flag: 'wx', mode: 0o644 });
      installed.push(name);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'EEXIST') {
        skipped.push(name);
        continue;
      }
      throw error;
    }
  }
  return { installed, skipped };
}
