import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evalsRoot = path.join(packageRoot, 'evals');
const skillsRoot = path.join(packageRoot, 'skills');

export function parseEvalArgs(args) {
  const options = { skill: null, caseId: null, output: null, help: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--skill' || arg === '--case' || arg === '--output') {
      const value = args[index + 1];
      if (value === undefined || value.startsWith('--')) throw new Error(`${arg} needs a value.`);
      if (arg === '--skill') options.skill = value;
      if (arg === '--case') options.caseId = value;
      if (arg === '--output') options.output = value;
      index += 1;
    } else {
      throw new Error(`Unknown option: ${arg}. Run with --help for usage.`);
    }
  }
  return options;
}

export async function loadEvalCases({ skill, caseId } = {}) {
  const files = (await readdir(evalsRoot)).filter((file) => file.endsWith('.json')).sort();
  const selectedFiles = skill ? files.filter((file) => file === `${skill}.json`) : files;
  if (skill && selectedFiles.length === 0) throw new Error(`No evals found for skill: ${skill}`);

  const cases = [];
  for (const file of selectedFiles) {
    const filePath = path.join(evalsRoot, file);
    let suite;
    try {
      suite = JSON.parse(await readFile(filePath, 'utf8'));
    } catch (error) {
      throw new Error(`Unable to read eval suite ${file}: ${error.message}`, { cause: error });
    }
    const expectedSkill = path.basename(file, '.json');
    if (suite?.skill !== expectedSkill || !Array.isArray(suite.evals)) {
      throw new Error(`Invalid eval suite structure: ${file}`);
    }
    const skillContent = await readFile(path.join(skillsRoot, expectedSkill, 'SKILL.md'), 'utf8');
    for (const item of suite.evals) {
      if (typeof item.id !== 'string' || typeof item.prompt !== 'string'
        || typeof item.should_trigger !== 'boolean' || !Array.isArray(item.assertions)
        || item.assertions.some((assertion) => typeof assertion !== 'string')) {
        throw new Error(`Invalid eval case in ${file}`);
      }
      if (!caseId || item.id === caseId) cases.push({ skill: expectedSkill, skillContent, ...item });
    }
  }
  if (caseId && cases.length === 0) {
    throw new Error(`No eval cases found${skill ? ` for skill ${skill}` : ''}: ${caseId}`);
  }
  return cases;
}

function parseGrade(content, assertions) {
  let result;
  try {
    result = JSON.parse(content);
  } catch (error) {
    throw new Error(`The model returned invalid grader JSON: ${error.message}`, { cause: error });
  }
  if (!result || !Array.isArray(result.results) || result.results.length !== assertions.length) {
    throw new Error('The model grader returned a different number of assertion results than requested.');
  }
  return result.results.map((grade, index) => {
    if (typeof grade?.passed !== 'boolean' || typeof grade.evidence !== 'string') {
      throw new Error(`The model grader returned an invalid result for assertion ${index + 1}.`);
    }
    return { assertion: assertions[index], passed: grade.passed, evidence: grade.evidence };
  });
}

async function complete({ config, messages, fetchImpl }) {
  let response;
  try {
    response = await fetchImpl(`${config.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${config.apiKey}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0,
        messages
      })
    });
  } catch (error) {
    const cause = error instanceof Error ? error.cause : undefined;
    const detail = cause instanceof Error
      ? `${cause.code ? `${cause.code}: ` : ''}${cause.message}`
      : error instanceof Error ? error.message : 'Unknown network error';
    throw new Error(`Could not connect to the Eval API: ${detail}`, { cause: error });
  }
  if (!response.ok) {
    const details = (await response.text()).slice(0, 1000);
    throw new Error(`Eval API request failed (${response.status}): ${details}`);
  }
  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || content.length === 0) {
    throw new Error('Eval API response did not contain a chat completion message.');
  }
  return content;
}

async function gradeResponse({ answer, assertions, config, fetchImpl }) {
  const checklist = assertions.map((assertion, index) => `${index + 1}. ${assertion}`).join('\n');
  const content = await complete({
    config,
    fetchImpl,
    messages: [
      {
        role: 'system',
        content: 'Grade the answer against each assertion independently. Mark passed true only when the answer provides clear evidence that it satisfies the assertion. Do not reward claims without supporting detail. Return only valid JSON in this shape: {"results":[{"passed":true,"evidence":"brief evidence from the answer"}]}. Include exactly one result per assertion, in order.'
      },
      {
        role: 'user',
        content: `Assertions:\n${checklist}\n\nAnswer to grade:\n${answer}`
      }
    ]
  });
  return parseGrade(content, assertions);
}

async function runVariant({ item, withSkill, config, fetchImpl }) {
  const messages = [
    {
      role: 'system',
      content: 'You are a helpful coding assistant. Respond directly to the user request. Do not claim to have inspected files, run commands, or used tools unless that is shown in the response.'
    }
  ];
  if (withSkill && item.should_trigger) {
    messages.push({ role: 'system', content: `Apply this skill's instructions:\n\n${item.skillContent}` });
  }
  messages.push({ role: 'user', content: item.prompt });
  const answer = await complete({ config, messages, fetchImpl });
  const grades = await gradeResponse({ answer, assertions: item.assertions, config, fetchImpl });
  return { answer, grades };
}

export async function evaluateCase({ item, config, fetchImpl = fetch }) {
  const baseline = await runVariant({ item, withSkill: false, config, fetchImpl });
  const withSkill = await runVariant({ item, withSkill: true, config, fetchImpl });
  return {
    skill: item.skill,
    id: item.id,
    should_trigger: item.should_trigger,
    baseline,
    with_skill: withSkill
  };
}

function summarizeGrades(results, variant) {
  const grades = results.flatMap((result) => result[variant].grades);
  const passed = grades.filter((grade) => grade.passed).length;
  return {
    passed,
    total: grades.length,
    rate: grades.length === 0 ? null : Number((passed / grades.length * 100).toFixed(1))
  };
}

export function summarizeResults(results, model) {
  const baseline = summarizeGrades(results, 'baseline');
  const withSkill = summarizeGrades(results, 'with_skill');
  return {
    model,
    cases: results.length,
    baseline,
    with_skill: withSkill,
    difference_percentage_points: baseline.rate === null || withSkill.rate === null
      ? null
      : Number((withSkill.rate - baseline.rate).toFixed(1))
  };
}

export async function writeEvalReport(filePath, report) {
  await writeFile(path.resolve(filePath), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}
