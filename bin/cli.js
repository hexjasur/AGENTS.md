#!/usr/bin/env node
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { installProject, removeInstalledFile, updateProject, getCurrentVersion } from '../lib/core.js';

const HELP = `agents-md v${getCurrentVersion()}

Foydalanish:
  npx @hexjasur/agents-md [init] [papka]
  npx @hexjasur/agents-md update [papka] [--force]
  npx @hexjasur/agents-md --version

Mavjud AGENTS.md bo‘lsa, standart javob bekor qilishdir. --force faqat update uchun.`;

async function askAction() {
  const readline = createInterface({ input: stdin, output: stdout });
  try {
    const answer = (await readline.question('AGENTS.md allaqachon mavjud. [d] Faylni o‘chirish, [r] Yangisiga almashtirish, [c] Bekor qilish (default): ')).trim().toLowerCase();
    if (answer === 'd' || answer === 'delete') return 'delete';
    if (answer === 'r' || answer === 'replace') return 'replace';
    return 'cancel';
  } finally {
    readline.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) { console.log(HELP); return; }
  if (args.includes('--version') || args.includes('-v')) { console.log(getCurrentVersion()); return; }
  const force = args.includes('--force');
  const positional = args.filter((arg) => arg !== '--force');
  const command = positional[0] === 'update' ? 'update' : 'init';
  const projectDir = positional[0] === 'update' || positional[0] === 'init' ? positional[1] ?? '.' : positional[0] ?? '.';
  if (positional.length > (positional[0] === 'update' || positional[0] === 'init' ? 2 : 1)) throw new Error('Ortiqcha argumentlar bor. --help ni ko‘ring.');
  let result;
  if (command === 'update') {
    result = await updateProject(projectDir, { force });
  } else {
    result = await installProject(projectDir);
    if (result.status === 'exists') {
      const action = await askAction();
      if (action === 'cancel') { console.log('Bekor qilindi; mavjud fayl o‘zgartirilmadi.'); return; }
      if (action === 'delete') result = await removeInstalledFile(projectDir, { force: true });
      if (action === 'replace') result = await installProject(projectDir, { replaceExisting: true, force: true });
    }
  }
  console.log(`${result.status}: ${result.targetPath}${result.version ? ` (v${result.version})` : ''}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : 'Noma’lum xatolik';
  console.error(`Xatolik: ${message}`);
  process.exitCode = 1;
});
