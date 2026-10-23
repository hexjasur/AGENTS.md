import { createHash } from 'node:crypto';
import { copyFile, mkdir, mkdtemp, readFile, readdir, rename, rm, rmdir, lstat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CURRENT_VERSION = JSON.parse(await readFile(path.join(packageRoot, 'package.json'), 'utf8')).version;
const VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const HASH_PATTERN = /^[a-f0-9]{64}$/;
const MANIFEST_VERSION = 1;
const CONTENT_PATH = path.join(packageRoot, 'AGENTS.md');
const SKILLS_PATH = path.join(packageRoot, 'skills');
const SCHEME_DIRECTORY = '.agent';
const SCHEME_FILENAME = 'hexjasurs.agent.scheme.json';
const LEGACY_DIRECTORY = '.agents-md';
const LEGACY_FILENAME = 'installation.json';

export function isValidVersion(value) {
  if (typeof value !== 'string' || value.length > 128 || !VERSION_PATTERN.test(value)) return false;
  const core = value.split(/[+-]/, 1)[0];
  return core.split('.').every((part) => Number.isSafeInteger(Number(part)));
}

function hashContent(content) {
  return createHash('sha256').update(content).digest('hex');
}

function isValidManifest(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const manifest = value;
  const keys = Object.keys(manifest).sort();
  return keys.length === 4 && keys.join(',') === 'contentHash,installedAt,schemaVersion,version'
    && manifest.schemaVersion === MANIFEST_VERSION
    && isValidVersion(manifest.version)
    && typeof manifest.installedAt === 'string'
    && !Number.isNaN(Date.parse(manifest.installedAt))
    && typeof manifest.contentHash === 'string'
    && HASH_PATTERN.test(manifest.contentHash);
}

async function existsAsRegularFile(filePath) {
  try {
    const info = await lstat(filePath);
    if (info.isSymbolicLink() || !info.isFile()) {
      throw new Error(`Security error: expected a regular file; symbolic links are not allowed: ${filePath}`);
    }
    return true;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return false;
    throw error;
  }
}

async function directoryExistsAsRegularDirectory(directoryPath) {
  try {
    const info = await lstat(directoryPath);
    if (info.isSymbolicLink() || !info.isDirectory()) {
      throw new Error(`Security error: manifest path must be a regular directory, not a symbolic link: ${directoryPath}`);
    }
    return true;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return false;
    throw error;
  }
}

async function readManifestFile(manifestPath) {
  if (!(await existsAsRegularFile(manifestPath))) return null;
  let parsed;
  try {
    parsed = JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch (error) {
    throw new Error(`Manifest JSON is invalid: ${manifestPath}`, { cause: error });
  }
  if (!isValidManifest(parsed)) throw new Error(`Manifest schema or version is invalid: ${manifestPath}`);
  return parsed;
}

async function readInstallationManifest(root) {
  const locations = [
    { directory: path.join(root, SCHEME_DIRECTORY), filename: SCHEME_FILENAME },
    { directory: path.join(root, LEGACY_DIRECTORY), filename: LEGACY_FILENAME }
  ];

  for (const location of locations) {
    if (!(await directoryExistsAsRegularDirectory(location.directory))) continue;
    const manifestPath = path.join(location.directory, location.filename);
    const manifest = await readManifestFile(manifestPath);
    if (manifest) return { manifest, manifestPath };
  }
  return null;
}

async function writeManifest(manifestPath, content) {
  const manifest = {
    schemaVersion: MANIFEST_VERSION,
    version: CURRENT_VERSION,
    installedAt: new Date().toISOString(),
    contentHash: hashContent(content)
  };
  const temporaryPath = `${manifestPath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  await rename(temporaryPath, manifestPath);
}

async function removeLegacyManifest(root) {
  const legacyDirectory = path.join(root, LEGACY_DIRECTORY);
  if (!(await directoryExistsAsRegularDirectory(legacyDirectory))) return;

  const legacyManifestPath = path.join(legacyDirectory, LEGACY_FILENAME);
  if (await readManifestFile(legacyManifestPath)) await rm(legacyManifestPath);

  try {
    await rmdir(legacyDirectory);
  } catch (error) {
    if (!(error instanceof Error) || !('code' in error) || !['ENOTEMPTY', 'EEXIST'].includes(error.code)) {
      throw error;
    }
  }
}

async function copyCurrentContent(targetPath) {
  const content = await readFile(CONTENT_PATH);
  const temporaryPath = `${targetPath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, content, { flag: 'wx', mode: 0o644 });
  await rename(temporaryPath, targetPath);
  return content;
}

async function copyDirectoryContents(sourceDirectory, targetDirectory) {
  const entries = await readdir(sourceDirectory, { withFileTypes: true });
  await mkdir(targetDirectory);

  for (const entry of entries) {
    const sourcePath = path.join(sourceDirectory, entry.name);
    const targetPath = path.join(targetDirectory, entry.name);
    const sourceInfo = await lstat(sourcePath);
    if (sourceInfo.isSymbolicLink()) {
      throw new Error(`Security error: symbolic links are not allowed in bundled skills: ${sourcePath}`);
    }
    if (sourceInfo.isDirectory()) {
      await copyDirectoryContents(sourcePath, targetPath);
    } else if (sourceInfo.isFile()) {
      await copyFile(sourcePath, targetPath);
    } else {
      throw new Error(`Unsupported file in bundled skills: ${sourcePath}`);
    }
  }
}

async function installSkills(root) {
  const skillsDirectory = path.join(root, SCHEME_DIRECTORY, 'skills');
  await mkdir(skillsDirectory, { recursive: true, mode: 0o755 });
  await directoryExistsAsRegularDirectory(skillsDirectory);

  const entries = await readdir(SKILLS_PATH, { withFileTypes: true });
  const installed = [];
  const skipped = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      throw new Error(`Unsupported entry in bundled skills: ${entry.name}`);
    }
    const sourcePath = path.join(SKILLS_PATH, entry.name);
    const sourceInfo = await lstat(sourcePath);
    if (sourceInfo.isSymbolicLink() || !sourceInfo.isDirectory()) {
      throw new Error(`Security error: bundled skill must be a regular directory: ${sourcePath}`);
    }

    const targetPath = path.join(skillsDirectory, entry.name);
    try {
      await lstat(targetPath);
      skipped.push(entry.name);
      continue;
    } catch (error) {
      if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error;
    }

    let temporaryDirectory;
    try {
      temporaryDirectory = await mkdtemp(path.join(skillsDirectory, '.agents-md-'));
      const temporaryPath = path.join(temporaryDirectory, entry.name);
      await copyDirectoryContents(sourcePath, temporaryPath);
      await rename(temporaryPath, targetPath);
      installed.push(entry.name);
    } finally {
      if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true });
    }
  }
  return { installed, skipped };
}

export async function installProject(projectDir, options = {}) {
  const root = path.resolve(projectDir);
  const targetPath = path.join(root, 'AGENTS.md');
  const dataDir = path.join(root, SCHEME_DIRECTORY);
  const manifestPath = path.join(dataDir, SCHEME_FILENAME);
  await mkdir(root, { recursive: true });
  const installation = await readInstallationManifest(root);
  const targetExists = await existsAsRegularFile(targetPath);
  if (targetExists && !options.replaceExisting) return { status: 'exists', targetPath };
  if (targetExists) {
    const oldContent = await readFile(targetPath);
    if (!options.force && (!installation || hashContent(oldContent) !== installation.manifest.contentHash)) {
      throw new Error('The existing AGENTS.md was modified or its manifest is missing; refusing to replace it. Use --force to confirm.');
    }
  }
  await mkdir(dataDir, { recursive: true, mode: 0o700 });
  await directoryExistsAsRegularDirectory(dataDir);
  const content = await copyCurrentContent(targetPath);
  await existsAsRegularFile(manifestPath);
  await writeManifest(manifestPath, content);
  const skills = await installSkills(root);
  await removeLegacyManifest(root);
  return { status: targetExists ? 'replaced' : 'installed', targetPath, version: CURRENT_VERSION, skills };
}

export async function installMissingSkills(projectDir) {
  const root = path.resolve(projectDir);
  const targetPath = path.join(root, 'AGENTS.md');
  const dataDir = path.join(root, SCHEME_DIRECTORY);
  await mkdir(root, { recursive: true });
  await mkdir(dataDir, { recursive: true, mode: 0o700 });
  await directoryExistsAsRegularDirectory(dataDir);
  const skills = await installSkills(root);
  return { status: 'kept', targetPath, skills };
}

export async function removeInstalledFile(projectDir, options = {}) {
  const root = path.resolve(projectDir);
  const targetPath = path.join(root, 'AGENTS.md');
  if (!(await existsAsRegularFile(targetPath))) return { status: 'missing', targetPath };
  const targetContent = await readFile(targetPath);
  const installation = await readInstallationManifest(root);
  if (!options.force && (!installation || hashContent(targetContent) !== installation.manifest.contentHash)) {
    throw new Error('AGENTS.md was modified or its manifest is invalid; refusing to remove it for safety.');
  }
  await rm(targetPath);
  if (installation) await rm(installation.manifestPath);
  await removeLegacyManifest(root);
  return { status: 'removed', targetPath };
}

export async function updateProject(projectDir, options = {}) {
  const root = path.resolve(projectDir);
  const installation = await readInstallationManifest(root);
  if (!installation) throw new Error('Installation manifest not found. Run the init command first.');
  if (!(await existsAsRegularFile(path.join(root, 'AGENTS.md')))) throw new Error('AGENTS.md was not found in the target project.');
  return installProject(root, { replaceExisting: true, force: options.force === true });
}

export function getCurrentVersion() {
  return CURRENT_VERSION;
}

export async function listBundledSkills() {
  const entries = await readdir(SKILLS_PATH, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
}
