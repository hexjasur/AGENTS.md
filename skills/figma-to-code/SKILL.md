---
name: figma-to-code
description: Turn Figma designs into production components with the Figma MCP server, Code Connect, and design variables, mapping layout, tokens, and states to existing code instead of generating one-off markup. Use when implementing a Figma frame or selection, reading Figma variables into Tailwind or CSS tokens, mapping Figma components to code components, or checking a build against its design.
license: MIT
metadata:
  author: hexjasur
  version: "1.0.0"
  last_reviewed: "2026-11-18"
---

# Figma to Code

Build from the design system, not from a screenshot. Find the existing component first, read the design context second, and write code last.

## Procedure

```text
- [ ] 1. Confirm access: the Figma MCP server is connected and the file is readable
- [ ] 2. Set up rules once: run the create_design_system_rules prompt and save its output
- [ ] 3. Map the design to existing components with get_libraries and search_design_system
- [ ] 4. Read structure with get_metadata, then context for the chosen node with get_design_context
- [ ] 5. Pull tokens with get_variable_defs; map each to a token already in the codebase
- [ ] 6. Implement with the project's components, tokens, and responsive rules
- [ ] 7. Check every state and breakpoint against the design, and compare screenshots
```

1. The MCP server must be connected in the editor or agent, and it must see the file. If it cannot read the file, ask for the link or a connected library, and stop there.
2. Run the `create_design_system_rules` prompt once and save the output to the project's `rules/` or `instructions/` folder. Re-run it after the design system changes.
3. Before writing any markup, search for an existing component with `search_design_system`. If a Figma component already maps to a code component (Code Connect), use that component and its props.
4. For a large frame, start with `get_metadata` to get the node outline. Then call `get_design_context` only on the nodes you will build. Reading the whole file at once wastes context and produces noisy output.
5. Use `get_variable_defs` for the colors, spacing, radii, and type used in the selection. Map each value to an existing token. Create a new token only when none exists, and name it by role (`surface-raised`), not by value (`gray-200`).
6. Build with the project's components and tokens. Use auto layout as a guide for flex and grid, but choose the simplest CSS that gives the same result.
7. Compare the result with `get_screenshot` at each breakpoint. Verify all states that the design shows: hover, focus, disabled, loading, empty, and error.

## Mapping rules

- **Component first.** A Figma instance with a Code Connect mapping becomes the code component with the mapped props. Do not rebuild it inline.
- **Tokens, not values.** Figma variables map to CSS custom properties or Tailwind `@theme` tokens. Components consume tokens and never hard-coded hex or pixel values.
- **Modes map to theme switches.** Light and dark modes in Figma become `:root` and `[data-theme="dark"]` or `prefers-color-scheme` values. Do not duplicate every component per mode.
- **Auto layout maps to flex or grid.** Padding and gap become spacing tokens. Fill-container and hug-contents become `flex: 1` and `width: fit-content`.
- **Constraints map to responsive rules.** Figma constraints are a starting point. Build the layout for the real breakpoints, not for the frame size in the file.
- **Text styles map to a type scale.** Use the scale in the codebase. If the Figma text style is a one-off, ask before adding it.
- **Icons and images.** Export SVG icons with `download_assets` and reuse the icon set already in the project. Do not inline a copied icon when an equivalent exists.

## Guardrails

- Never ship absolute positioning copied from Figma's x and y values. It breaks at any other width.
- Never copy generated code without checking it against the codebase's components, naming, and lint rules.
- Never hard-code text from the design file when the project uses i18n keys.
- Never drop accessibility because the design is visual: keep semantic elements, accessible names, focus states, and contrast from the design tokens.
- Do not treat MCP output as final. The agent generates code from design data, so the result must be reviewed and matched to the codebase.
- Do not use `get_design_context` on a whole page when a single section is enough. Narrow the node first.

## Gotchas

- A Figma layer name is not a component name. Use Code Connect mappings or the library component name, not the layer label, for identity.
- Variables with aliases reference other variables. Resolve the alias to the final token and keep the alias chain in the token file only when the codebase already uses one.
- Published variables omit modes. To read values for light and dark, read the local variables of the same file.
- Figma's auto layout and CSS flex differ on min and max sizes and on wrapping. Verify text overflow at narrow widths.
- Shadows and blurs in Figma are approximations of CSS. Match them with the codebase's elevation tokens, then compare visually.
- Designs often show only one state. Ask for the missing states rather than inventing them.
- Image and video fills may use placeholder URLs in the design. Replace them before shipping and check their license.

## Review format

List findings by impact (broken layout, wrong token, missing state, accessibility, duplication). For each, give the node or component, the problem, and the fix using the codebase's token or component. State which breakpoints and states were compared, and which were not.

Read `references/figma-mcp-tools.md` for the tool list, the recommended call order, and the Variables REST endpoints. Pair this skill with `ui-ux-design` for token and state rules and `react-typescript` for component code.
