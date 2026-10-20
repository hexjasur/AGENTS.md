#!/usr/bin/env node
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { installProject, removeInstalledFile, updateProject, getCurrentVersion } from '../lib/core.js';

const HELP = `agents-md v${getCurrentVersion()}

USAGE:
  npx -y @hexjasur/agents-md [init] [directory]
  npx -y @hexjasur/agents-md update [directory] [--force]
  npx -y @hexjasur/agents-md --version

COMMANDS:
  init      Install AGENTS.md in the current or specified directory (default).
  update    Update a previously installed AGENTS.md.

OPTIONS:
  --force   Replace a modified AGENTS.md during update.
  --version Show the installed package version.
  --help    Show this help message.

If AGENTS.md already exists, init asks whether to delete, replace, or keep it.
The default action is to keep the existing file. --force is only available for update.`;

async function askAction() {
  const readline = createInterface({ input: stdin, output: stdout });
  try {
    const answer = (await readline.question('AGENTS.md already exists. [d] Delete, [r] Replace, [c] Cancel (default): ')).trim().toLowerCase();
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
  if (positional.length > (positional[0] === 'update' || positional[0] === 'init' ? 2 : 1)) throw new Error('Too many arguments. Run with --help for usage.');
  let result;
  if (command === 'update') {
    result = await updateProject(projectDir, { force });
  } else {
    result = await installProject(projectDir);
    if (result.status === 'exists') {
      const action = await askAction();
      if (action === 'cancel') { console.log('Cancelled; the existing file was not changed.'); return; }
      if (action === 'delete') result = await removeInstalledFile(projectDir, { force: true });
      if (action === 'replace') result = await installProject(projectDir, { replaceExisting: true, force: true });
    }
  }
  console.log(`${result.status}: ${result.targetPath}${result.version ? ` (v${result.version})` : ''}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
