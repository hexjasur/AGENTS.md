#!/usr/bin/env node
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import path from 'node:path';
import { installProject, installMissingSkills, removeInstalledFile, updateProject, getCurrentVersion, listBundledSkills, describeBundledSkills, resolveSkillSelection } from '../lib/core.js';

const HELP = `agents-md v${getCurrentVersion()}

USAGE:
  npx -y @hexjasur/agents-md [init] [directory]
  npx -y @hexjasur/agents-md init [directory] [--yes] [--skills <list>]
  npx -y @hexjasur/agents-md --list-skills
  npx -y @hexjasur/agents-md update [directory] [--force]
  npx -y @hexjasur/agents-md --version

COMMANDS:
  init      Install AGENTS.md in the current or specified directory (default).
  update    Update a previously installed AGENTS.md.

OPTIONS:
  --yes     Skip the initial install confirmation; existing files are not overwritten.
  --skills  Comma-separated skills to install (default: all). Example: --skills tauri-auto-update,react-typescript
  --list-skills  Show the bundled skills and exit.
  --force   Replace a modified AGENTS.md during update.
  --version Show the installed package version.
  --help    Show this help message.

Install includes AGENTS.md and the selected (default: all) bundled skills in .agent/skills.
Update adds missing bundled skills too; pass --skills to limit which ones.
If AGENTS.md already exists, init keeps it and installs missing skills by default.
--yes skips prompts and never replaces existing files. --force is only available for update.`;

function createQuestioner() {
  const readline = createInterface({ input: stdin, output: stdout });
  const lines = readline[Symbol.asyncIterator]();
  return {
    async ask(prompt) {
      stdout.write(prompt);
      const result = await lines.next();
      return result.done ? '' : result.value;
    },
    close() { readline.close(); }
  };
}

async function askInstallConfirmation(questioner, projectDir, selection) {
  const skills = selection ?? (await listBundledSkills());
  console.log('@hexjasur/agents-md includes project-wide instructions and modular Agent Skills.');
  console.log(`${selection ? 'Selected' : 'Included'} skills: ${skills.join(', ')}`);
  console.log(`Target: ${path.resolve(projectDir)}`);
  console.log('Install targets: AGENTS.md and .agent/skills/<skill>/');
  console.log('The installer manifest (.agent/hexjasurs.agent.scheme.json) is written only when it installs AGENTS.md.');
  const answer = (await questioner.ask('Continue with installation? [y/N]: ')).trim().toLowerCase();
  return answer === 'y' || answer === 'yes';
}

async function askAction(questioner) {
  const answer = (await questioner.ask('AGENTS.md exists. [k] Keep and install missing skills, [r] Replace, [d] Delete, [c] Cancel (default: k): ')).trim().toLowerCase();
  if (answer === '' || answer === 'k' || answer === 'keep') return 'keep';
  if (answer === 'd' || answer === 'delete') return 'delete';
  if (answer === 'r' || answer === 'replace') return 'replace';
  return 'cancel';
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) { console.log(HELP); return; }
  if (args.includes('--version') || args.includes('-v')) { console.log(getCurrentVersion()); return; }
  if (args.includes('--list-skills')) {
    for (const { name, description } of await describeBundledSkills()) {
      const summary = description.length > 100 ? `${description.slice(0, 97)}...` : description;
      console.log(`${name.padEnd(24)} ${summary}`);
    }
    return;
  }
  let force = false;
  let yes = false;
  let skillNames;
  const positional = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--force') force = true;
    else if (arg === '--yes') yes = true;
    else if (arg === '--skills') {
      const value = args[index + 1];
      if (value === undefined || value.startsWith('--')) throw new Error('--skills needs a comma-separated list of skill names, or "all".');
      skillNames = value.split(',');
      index += 1;
    } else if (arg.startsWith('--skills=')) skillNames = arg.slice('--skills='.length).split(',');
    else if (arg.startsWith('--')) throw new Error(`Unknown option: ${arg}. Run with --help for usage.`);
    else positional.push(arg);
  }
  const selection = await resolveSkillSelection(skillNames);
  const command = positional[0] === 'update' ? 'update' : 'init';
  const projectDir = positional[0] === 'update' || positional[0] === 'init' ? positional[1] ?? '.' : positional[0] ?? '.';
  if (positional.length > (positional[0] === 'update' || positional[0] === 'init' ? 2 : 1)) throw new Error('Too many arguments. Run with --help for usage.');
  let result;
  if (command === 'update') {
    result = await updateProject(projectDir, { force, skills: selection });
  } else {
    const questioner = createQuestioner();
    try {
      if (!yes && !(await askInstallConfirmation(questioner, projectDir, selection))) {
        console.log('Cancelled; no files were installed.');
        return;
      }
      result = await installProject(projectDir, { skills: selection });
      if (result.status === 'exists') {
        const action = yes ? 'keep' : await askAction(questioner);
        if (action === 'cancel') { console.log('Cancelled; the existing file was not changed.'); return; }
        if (action === 'delete') result = await removeInstalledFile(projectDir, { force: true });
        if (action === 'replace') result = await installProject(projectDir, { replaceExisting: true, force: true, skills: selection });
        if (action === 'keep') result = await installMissingSkills(projectDir, { skills: selection });
      }
    } finally {
      questioner.close();
    }
  }
  console.log(`${result.status}: ${result.targetPath}${result.version ? ` (v${result.version})` : ''}`);
  if (result.skills) {
    if (result.skills.installed.length) console.log(`Installed skills: ${result.skills.installed.join(', ')}`);
    if (result.skills.skipped.length) console.log(`Kept existing skills: ${result.skills.skipped.join(', ')}`);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
