import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCase, parseEvalArgs, summarizeResults } from '../lib/eval-runner.js';

const config = { apiKey: 'test-key', baseUrl: 'https://example.test/v1/', model: 'test-model' };

function completion(content) {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });
}

test('eval CLI arguments support skill, case, output, and help', () => {
  assert.deepEqual(parseEvalArgs(['--skill', 'web-seo', '--case', 'casual', '--output', 'report.json']), {
    skill: 'web-seo',
    caseId: 'casual',
    output: 'report.json',
    help: false
  });
  assert.equal(parseEvalArgs(['--help']).help, true);
  assert.throws(() => parseEvalArgs(['--skill']), /needs a value/);
  assert.throws(() => parseEvalArgs(['--unknown']), /Unknown option/);
});

test('eval compares the same prompt with and without the expected skill', async () => {
  const requests = [];
  const responses = [
    'Baseline answer',
    '{"results":[{"passed":false,"evidence":"No recommendations"}]}',
    'Skill answer',
    '{"results":[{"passed":true,"evidence":"Includes the recommendation"}]}'
  ];
  const item = {
    skill: 'web-seo',
    id: 'casual',
    prompt: 'Help improve indexing',
    should_trigger: true,
    assertions: ['Suggests Search Console URL inspection'],
    skillContent: 'Use the SEO skill.'
  };
  const result = await evaluateCase({
    item,
    config,
    fetchImpl: async (url, options) => {
      requests.push({ url, body: JSON.parse(options.body) });
      return completion(responses.shift());
    }
  });

  assert.equal(requests.length, 4);
  assert.equal(requests[0].url, 'https://example.test/v1/chat/completions');
  assert.equal(requests[0].body.messages.at(-1).content, item.prompt);
  assert.equal(requests[2].body.messages.at(-1).content, item.prompt);
  assert.equal(requests[0].body.messages.some((message) => message.content.includes(item.skillContent)), false);
  assert.equal(requests[2].body.messages.some((message) => message.content.includes(item.skillContent)), true);
  assert.equal(result.baseline.grades[0].passed, false);
  assert.equal(result.with_skill.grades[0].passed, true);
});

test('negative evals do not load the skill in the skill-enabled variant', async () => {
  let skillInstructionsIncluded = false;
  const responses = [
    'First answer',
    '{"results":[{"passed":true,"evidence":"Relevant"}]}',
    'Second answer',
    '{"results":[{"passed":true,"evidence":"Relevant"}]}'
  ];
  await evaluateCase({
    item: {
      skill: 'web-seo',
      id: 'negative',
      prompt: 'Fix a CSS bug',
      should_trigger: false,
      assertions: ['The skill is not loaded'],
      skillContent: 'SEO skill instructions'
    },
    config,
    fetchImpl: async (_url, options) => {
      const body = JSON.parse(options.body);
      if (body.messages.some((message) => message.content.includes('SEO skill instructions'))) skillInstructionsIncluded = true;
      return completion(responses.shift());
    }
  });
  assert.equal(skillInstructionsIncluded, false);
});

test('eval reports the underlying cause when the API connection fails', async () => {
  const item = {
    skill: 'web-seo',
    id: 'casual',
    prompt: 'Help improve indexing',
    should_trigger: true,
    assertions: ['Suggests Search Console URL inspection'],
    skillContent: 'Use the SEO skill.'
  };
  await assert.rejects(
    evaluateCase({
      item,
      config,
      fetchImpl: async () => {
        throw new TypeError('fetch failed', { cause: Object.assign(new Error('connection refused'), { code: 'ECONNREFUSED' }) });
      }
    }),
    /Could not connect to the Eval API: ECONNREFUSED: connection refused/
  );
});

test('summary reports assertion pass rates and percentage-point difference', () => {
  const results = [{
    baseline: { grades: [{ passed: true }, { passed: false }] },
    with_skill: { grades: [{ passed: true }, { passed: true }] }
  }];
  assert.deepEqual(summarizeResults(results, 'test-model'), {
    model: 'test-model',
    cases: 1,
    baseline: { passed: 1, total: 2, rate: 50 },
    with_skill: { passed: 2, total: 2, rate: 100 },
    difference_percentage_points: 50
  });
});
