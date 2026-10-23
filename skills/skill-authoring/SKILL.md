---
name: skill-authoring
description: Create, validate, package, and improve Agent Skills following the agentskills.io specification. Use when writing or reviewing SKILL.md files, splitting AGENTS.md into modules, designing references or scripts, or evaluating skill quality.
license: MIT
metadata:
  author: hexjasur
  version: "1.0.0"
---

# Skill Authoring

Design one coherent capability, not an encyclopedia. The description must say what the skill does and when to use it because it is the primary activation signal.

## Workflow

1. Define the recurring task, trigger phrases, expected output, and the mistakes the agent makes without this skill.
2. Keep `SKILL.md` focused on the core procedure. Move detailed variants to `references/`, deterministic repeated work to `scripts/`, and templates/assets to their own directories.
3. Use lowercase hyphenated names, required frontmatter, relative resource paths, and explicit load conditions for references.
4. Add 2–3 realistic eval prompts, including a casual phrasing and an edge case. Prefer observable assertions over vague quality claims.
5. Validate the skill, run representative examples, compare with/without the skill when possible, and refine from concrete failures.

A good skill is discoverable, concise, composable, safe, and measurably better than no skill. Avoid duplicating general model knowledge or forcing a rigid output format when the task allows reasonable variation.
