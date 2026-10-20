import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, rm, lstat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CURRENT_VERSION = JSON.parse(await readFile(path.join(packageRoot, 'package.json'), 'utf8')).version;
const VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const HASH_PATTERN = /^[a-f0-9]{64}$/;
const MANIFEST_VERSION = 1;
const CONTENT_PATH = path.join(packageRoot, 'AGENTS.md');

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
    if (info.isSymbolicLink() || !info.isFile()) throw new Error(`Xavfsizlik: oddiy fayl emas yoki symlink: ${filePath}`);
    return true;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return false;
    throw error;
  }
}

async function readManifest(manifestPath) {
  if (!(await existsAsRegularFile(manifestPath))) return null;
  let parsed;
  try {
    parsed = JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch (error) {
    throw new Error(`Manifest JSON yaroqsiz: ${manifestPath}`, { cause: error });
  }
  if (!isValidManifest(parsed)) throw new Error(`Manifest sxemasi yoki versiyasi noto‘g‘ri: ${manifestPath}`);
  return parsed;
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

async function copyCurrentContent(targetPath) {
  const content = await readFile(CONTENT_PATH);
  const temporaryPath = `${targetPath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, content, { flag: 'wx', mode: 0o644 });
  await rename(temporaryPath, targetPath);
  return content;
}

export async function installProject(projectDir, options = {}) {
  const root = path.resolve(projectDir);
  const targetPath = path.join(root, 'AGENTS.md');
  const dataDir = path.join(root, '.agents-md');
  const manifestPath = path.join(dataDir, 'installation.json');
  await mkdir(root, { recursive: true });
  const targetExists = await existsAsRegularFile(targetPath);
  if (targetExists && !options.replaceExisting) return { status: 'exists', targetPath };
  if (targetExists) {
    const oldContent = await readFile(targetPath);
    const manifest = await readManifest(manifestPath);
    if (!options.force && (!manifest || hashContent(oldContent) !== manifest.contentHash)) {
      throw new Error('Mavjud AGENTS.md o‘zgartirilgan yoki manifest topilmadi; xavfsiz almashtirish rad etildi. --force bilan tasdiqlang.');
    }
  }
  await mkdir(dataDir, { recursive: true, mode: 0o700 });
  const dataDirInfo = await lstat(dataDir);
  if (dataDirInfo.isSymbolicLink() || !dataDirInfo.isDirectory()) {
    throw new Error(`Xavfsizlik: manifest papkasi oddiy papka emas yoki symlink: ${dataDir}`);
  }
  const content = await copyCurrentContent(targetPath);
  await writeManifest(manifestPath, content);
  return { status: targetExists ? 'replaced' : 'installed', targetPath, version: CURRENT_VERSION };
}

export async function removeInstalledFile(projectDir, options = {}) {
  const root = path.resolve(projectDir);
  const targetPath = path.join(root, 'AGENTS.md');
  const manifestPath = path.join(root, '.agents-md', 'installation.json');
  if (!(await existsAsRegularFile(targetPath))) return { status: 'missing', targetPath };
  const targetContent = await readFile(targetPath);
  const manifest = await readManifest(manifestPath);
  if (!options.force && (!manifest || hashContent(targetContent) !== manifest.contentHash)) {
    throw new Error('AGENTS.md o‘zgartirilgan yoki manifest yaroqsiz; xavfsizlik uchun o‘chirish rad etildi.');
  }
  await rm(targetPath);
  await rm(manifestPath);
  return { status: 'removed', targetPath };
}

export async function updateProject(projectDir, options = {}) {
  const root = path.resolve(projectDir);
  const manifestPath = path.join(root, '.agents-md', 'installation.json');
  const manifest = await readManifest(manifestPath);
  if (!manifest) throw new Error('O‘rnatish manifesti topilmadi. Avval init buyrug‘ini bajaring.');
  if (!(await existsAsRegularFile(path.join(root, 'AGENTS.md')))) throw new Error('Loyihada AGENTS.md topilmadi.');
  return installProject(root, { replaceExisting: true, force: options.force === true });
}

export function getCurrentVersion() {
  return CURRENT_VERSION;
}
