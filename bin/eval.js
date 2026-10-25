#!/usr/bin/env node
import {
  evaluateCase,
  loadEvalCases,
  parseEvalArgs,
  summarizeResults,
  writeEvalReport
} from '../lib/eval-runner.js';

const HELP = `Usage: npm run eval -- [options]

Run every eval against an OpenAI-compatible Chat Completions API.

Required environment:
  EVAL_API_KEY       API key
  EVAL_MODEL         Model name

Optional environment:
  EVAL_BASE_URL      API base URL (default: https://api.openai.com/v1)

Options:
  --skill <name>     Run only one skill's evals
  --case <id>        Run only a case ID (may be combined with --skill)
  --output <file>    Write full responses and grades to a JSON file
  --help             Show this help`;

async function main() {
  const options = parseEvalArgs(process.argv.slice(2));
  if (options.help) {
    console.log(HELP);
    return;
  }
  const apiKey = process.env.EVAL_API_KEY;
  const model = process.env.EVAL_MODEL;
  if (!apiKey) throw new Error('Set EVAL_API_KEY before running evals.');
  if (!model) throw new Error('Set EVAL_MODEL before running evals.');

  const config = {
    apiKey,
    model,
    baseUrl: process.env.EVAL_BASE_URL || 'https://api.openai.com/v1'
  };
  const cases = await loadEvalCases(options);
  const results = [];
  for (const item of cases) {
    console.log(`Evaluating ${item.skill}/${item.id}...`);
    results.push(await evaluateCase({ item, config }));
  }

  const report = {
    generated_at: new Date().toISOString(),
    summary: summarizeResults(results, model),
    results
  };
  const { baseline, with_skill: withSkill, difference_percentage_points: difference } = report.summary;
  console.log(`Baseline: ${baseline.passed}/${baseline.total} (${baseline.rate}%)`);
  console.log(`With skill: ${withSkill.passed}/${withSkill.total} (${withSkill.rate}%)`);
  console.log(`Difference: ${difference > 0 ? '+' : ''}${difference} percentage points`);
  if (options.output) {
    await writeEvalReport(options.output, report);
    console.log(`Report written to ${options.output}`);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
