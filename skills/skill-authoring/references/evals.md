# Skill validation and evals

Load this after `SKILL.md` when validating or measuring a skill.

## Validation checklist

- [ ] `SKILL.md` starts with `---` frontmatter on line 1
- [ ] `name` matches the directory, is lowercase-hyphenated, and is at most 64 characters
- [ ] `description` is 1 to 1024 characters, says what and when, and contains the user's keywords
- [ ] Optional fields valid: `license`, `compatibility`, `metadata` (string values), `allowed-tools`
- [ ] `SKILL.md` is under 500 lines; large content lives in `references/`
- [ ] Every file in `references/`, `scripts/`, and `assets/` is linked from `SKILL.md` with a load condition
- [ ] Links are relative, one level deep, and resolve; no symlinks
- [ ] No secrets, personal data, or absolute machine paths
- [ ] Scripts run non-interactively, validate arguments, and fail with clear errors

## Eval template

Store evals next to the skill (for example `evals/evals.json`) or in your test suite.

```json
[
  {
    "id": "casual-trigger",
    "prompt": "my page feels slow on phones, can you look into it",
    "should_trigger": true,
    "assertions": [
      "Measures before changing anything",
      "Reports LCP, INP, or CLS or states they were not available",
      "Changes one thing at a time"
    ]
  },
  {
    "id": "edge-case",
    "prompt": "Lighthouse says 98 but users complain it is slow",
    "should_trigger": true,
    "assertions": [
      "Distinguishes lab data from field data",
      "Asks for or checks real-user metrics"
    ]
  },
  {
    "id": "negative",
    "prompt": "rename this variable across the file",
    "should_trigger": false,
    "assertions": ["The skill is not loaded"]
  }
]
```

Write assertions a reviewer can check from the transcript or output. Avoid "is high quality".

## Running an eval

1. Run each prompt without the skill and save the output (baseline).
2. Run again with the skill enabled and save the output.
3. Grade every assertion pass or fail for both runs. Include a trigger check for each prompt.
4. Read failing runs end to end. Change the skill only to fix an observed failure: sharpen the description for missed triggers, add a guardrail or gotcha for wrong behavior, or cut text that changed nothing.
5. Re-run all evals after each change so a fix does not regress another case.

A skill that does not beat the baseline on its own evals is not ready.

## Description tuning

- Missed triggers: add the verbs and nouns users really use ("slow", "not indexed", "contrast", "CSP").
- False triggers: narrow the scope and name what the skill is not for.
- Test with 10 or more prompts, mixing formal, casual, and ambiguous phrasing, and check both trigger and non-trigger rates.

## Sources

- [Agent Skills specification](https://agentskills.io/specification)
- [Agent Skills: what are skills](https://agentskills.io/what-are-skills)
- [AGENTS.md](https://agents.md/)
- [Skill authoring best practices](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices)
