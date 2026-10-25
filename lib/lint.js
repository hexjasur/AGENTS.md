import { lstat, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SECRET_PATTERNS = [
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{30,}\b/,
  /\bsk-[A-Za-z0-9]{20,}\b/,
  /\bAIza[0-9A-Za-z_-]{35}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/
];
const PIPE_TO_SHELL = /^\s*(?:\$|>|`)?\s*(?:curl|wget)\b[^\n]*\|\s*(?:sudo\s+)?(?:ba)?sh\b/i;

function getFrontmatter(content, file) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error(`${file}: SKILL.md must start with YAML frontmatter.`);
  const fields = new Map();
  const lines = match[1].split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const field = line.match(/^([a-z][a-z0-9_-]*):\s*(.*)$/i);
    if (!field) continue;
    const [, key, rawValue] = field;
    if (/^[|>][+-]?\d?$/.test(rawValue)) {
      const contents = [];
      while (index + 1 < lines.length && (lines[index + 1].trim() === '' || /^\s/.test(lines[index + 1]))) {
        index += 1;
        contents.push(lines[index].trim());
      }
      fields.set(key, rawValue.startsWith('>') ? contents.join(' ') : contents.join('\n'));
    } else {
      fields.set(key, rawValue.replace(/^['"]|['"]$/g, ''));
    }
  }
  return { raw: match[1], fields };
}

function validateFrontmatterSyntax(frontmatter, file, issues) {
  const topLevelKeys = new Set();
  const metadataKeys = new Set();
  let inMetadata = false;
  let inBlockScalar = false;
  for (const [index, line] of frontmatter.raw.split(/\r?\n/).entries()) {
    if (inBlockScalar) {
      if (line.trim() === '' || /^\s/.test(line)) continue;
      inBlockScalar = false;
    }
    if (line.trim() === '') continue;
    const nested = line.match(/^  ([a-z][a-z0-9_-]*):\s*(.*)$/i);
    if (nested) {
      if (!inMetadata || nested[2].length === 0) {
        addIssue(issues, file, `invalid YAML metadata field on frontmatter line ${index + 1}.`);
      } else if (metadataKeys.has(nested[1])) {
        addIssue(issues, file, `duplicate metadata key "${nested[1]}".`);
      } else {
        metadataKeys.add(nested[1]);
      }
      continue;
    }
    const field = line.match(/^([a-z][a-z0-9_-]*):\s*(.*)$/i);
    if (!field) {
      addIssue(issues, file, `invalid YAML frontmatter on line ${index + 1}.`);
      inMetadata = false;
      continue;
    }
    const [, key, value] = field;
    if (!['name', 'description', 'license', 'compatibility', 'allowed-tools', 'metadata'].includes(key)) {
      addIssue(issues, file, `unsupported frontmatter field "${key}".`);
    }
    if (topLevelKeys.has(key)) addIssue(issues, file, `duplicate frontmatter field "${key}".`);
    topLevelKeys.add(key);
    inMetadata = key === 'metadata';
    if (inMetadata && value.length > 0) addIssue(issues, file, 'metadata must be a mapping of string values.');
    if (!inMetadata && value.length === 0) addIssue(issues, file, `frontmatter field "${key}" must have a value.`);
    if (/^[|>][+-]?\d?$/.test(value)) {
      if (!['description', 'compatibility'].includes(key)) {
        addIssue(issues, file, `frontmatter field "${key}" cannot use a block scalar.`);
      }
      inMetadata = false;
      inBlockScalar = true;
    } else {
      if (value.startsWith('"') && !value.endsWith('"')) addIssue(issues, file, `frontmatter field "${key}" has an unterminated quoted value.`);
      if (value.startsWith("'") && !value.endsWith("'")) addIssue(issues, file, `frontmatter field "${key}" has an unterminated quoted value.`);
    }
  }
}

async function collectFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      files.push({ path: filePath, symlink: true });
    } else if (entry.isDirectory()) {
      files.push(...await collectFiles(filePath));
    } else if (entry.isFile()) {
      files.push({ path: filePath, symlink: false });
    }
  }
  return files;
}

function addIssue(issues, filePath, message) {
  issues.push(`${filePath}: ${message}`);
}

function extractLocalMarkdownLinks(content) {
  const links = [];
  for (const match of content.matchAll(/!?\[[^\]]*\]\((<[^>]+>|[^)\s]+)(?:\s+[^)]*)?\)/g)) {
    const target = match[1].replace(/^<|>$/g, '').split('#', 1)[0];
    if (target && !/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(target)) links.push(target);
  }
  return links;
}

async function lintSkill(skillPath, { maxReviewAgeDays, now }) {
  const issues = [];
  const skillName = path.basename(skillPath);
  const skillFile = path.join(skillPath, 'SKILL.md');
  const files = await collectFiles(skillPath);
  const skillFileInfo = files.find((file) => file.path === skillFile);
  if (!skillFileInfo || skillFileInfo.symlink) {
    return [`${skillFile}: required regular SKILL.md file is missing or is a symbolic link.`];
  }

  const contentByPath = new Map();
  for (const file of files) {
    if (file.symlink) {
      addIssue(issues, file.path, 'symbolic links are not allowed.');
      continue;
    }
    const content = await readFile(file.path, 'utf8');
    contentByPath.set(file.path, content);
    if (SECRET_PATTERNS.some((pattern) => pattern.test(content))) {
      addIssue(issues, file.path, 'possible credential or private key detected.');
    }
    for (const [index, line] of content.split(/\r?\n/).entries()) {
      if (PIPE_TO_SHELL.test(line)) {
        addIssue(issues, file.path, `line ${index + 1}: downloads and pipes remote content to a shell.`);
      }
    }
  }

  let frontmatter;
  const skillContent = contentByPath.get(skillFile);
  try {
    frontmatter = getFrontmatter(skillContent, skillFile);
  } catch (error) {
    issues.push(error.message);
    return issues;
  }
  validateFrontmatterSyntax(frontmatter, skillFile, issues);

  const name = frontmatter.fields.get('name');
  if (!name || !SKILL_NAME.test(name) || name !== skillName || name.length > 64) {
    addIssue(issues, skillFile, `name must be lowercase-hyphenated, at most 64 characters, and match "${skillName}".`);
  }
  const description = frontmatter.fields.get('description');
  if (!description || description.length > 1024) {
    addIssue(issues, skillFile, 'description must contain 1 to 1024 characters.');
  }
  if (!/\bUse (?:when|for)\b/i.test(description ?? '')) {
    addIssue(issues, skillFile, 'description must state when the skill should be used.');
  }
  if (skillContent.split(/\r?\n/).length > 500) {
    addIssue(issues, skillFile, 'SKILL.md must be at most 500 lines.');
  }
  const compatibility = frontmatter.fields.get('compatibility');
  if (compatibility && compatibility.length > 500) {
    addIssue(issues, skillFile, 'compatibility must be at most 500 characters.');
  }

  const reviewDate = frontmatter.raw.match(/^  last_reviewed:\s*["']?(\d{4}-\d{2}-\d{2})["']?\s*$/m)?.[1]
    ?? frontmatter.raw.match(/^last_reviewed:\s*["']?(\d{4}-\d{2}-\d{2})["']?\s*$/m)?.[1];
  if (reviewDate) {
    const parsedDate = new Date(`${reviewDate}T00:00:00.000Z`);
    if (Number.isNaN(parsedDate.valueOf()) || parsedDate.toISOString().slice(0, 10) !== reviewDate) {
      addIssue(issues, skillFile, 'last_reviewed must be a valid YYYY-MM-DD date.');
    } else if (parsedDate > now) {
      addIssue(issues, skillFile, 'last_reviewed cannot be in the future.');
    } else if (maxReviewAgeDays !== undefined) {
      const ageDays = Math.floor((now - parsedDate) / 86_400_000);
      if (ageDays > maxReviewAgeDays) {
        addIssue(issues, skillFile, `last_reviewed is ${ageDays} days old (maximum ${maxReviewAgeDays}).`);
      }
    }
  } else if (maxReviewAgeDays !== undefined) {
    addIssue(issues, skillFile, `last_reviewed is missing (required for a ${maxReviewAgeDays}-day review check).`);
  }

  for (const directoryName of ['references', 'scripts', 'assets']) {
    const resourceDirectory = path.join(skillPath, directoryName);
    const resources = files.filter((file) => file.path.startsWith(`${resourceDirectory}${path.sep}`) && !file.symlink);
    for (const resource of resources) {
      const relativePath = path.relative(skillPath, resource.path).split(path.sep).join('/');
      if (!skillContent.includes(relativePath)) {
        addIssue(issues, skillFile, `${relativePath} is not linked from SKILL.md.`);
      }
    }
  }

  for (const [filePath, fileContent] of contentByPath) {
    for (const link of extractLocalMarkdownLinks(fileContent)) {
      let decodedLink;
      try {
        decodedLink = decodeURIComponent(link);
      } catch {
        addIssue(issues, filePath, `invalid URL encoding in relative link: ${link}`);
        continue;
      }
      const destination = path.resolve(path.dirname(filePath), decodedLink);
      if (destination !== skillPath && !destination.startsWith(`${skillPath}${path.sep}`)) {
        addIssue(issues, filePath, `link escapes the skill directory: ${link}`);
        continue;
      }
      try {
        const info = await lstat(destination);
        if (info.isSymbolicLink() || (!info.isFile() && !info.isDirectory())) {
          addIssue(issues, filePath, `link target is not a regular file or directory: ${link}`);
        }
      } catch (error) {
        if (error.code === 'ENOENT') addIssue(issues, filePath, `broken relative link: ${link}`);
        else throw error;
      }
    }
  }
  return issues;
}

export async function lintSkills(targetPath, { maxReviewAgeDays, now = new Date() } = {}) {
  const resolvedPath = path.resolve(targetPath);
  const targetInfo = await lstat(resolvedPath);
  if (targetInfo.isSymbolicLink() || !targetInfo.isDirectory()) {
    throw new Error(`Lint target must be a regular directory: ${resolvedPath}`);
  }

  const entries = await readdir(resolvedPath, { withFileTypes: true });
  const skillDirectories = entries
    .filter((entry) => entry.isDirectory() && !entry.isSymbolicLink())
    .map((entry) => path.join(resolvedPath, entry.name));
  const results = [];
  const rootSkillFile = path.join(resolvedPath, 'SKILL.md');
  try {
    const info = await lstat(rootSkillFile);
    if (info.isSymbolicLink() || !info.isFile()) {
      return [{ skill: path.basename(resolvedPath), issues: [`${rootSkillFile}: must be a regular file, not a symbolic link.`] }];
    }
    results.push({
      skill: path.basename(resolvedPath),
      issues: await lintSkill(resolvedPath, { maxReviewAgeDays, now })
    });
    return results;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  for (const entry of entries.filter((item) => item.isSymbolicLink())) {
    results.push({
      skill: entry.name,
      issues: [`${path.join(resolvedPath, entry.name)}: symbolic links are not allowed.`]
    });
  }
  if (skillDirectories.length === 0 && results.length === 0) {
    throw new Error(`No skill directories containing SKILL.md found: ${resolvedPath}`);
  }
  const targets = skillDirectories;
  for (const skillPath of targets) {
    const issues = await lintSkill(skillPath, { maxReviewAgeDays, now });
    results.push({ skill: path.basename(skillPath), issues });
  }
  return results;
}
