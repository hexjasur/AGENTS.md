# Figma MCP tools and call order

Source: Figma developer documentation, "tools and prompts" for the Figma MCP server (checked 2026-11-18). Tool names and parameters change; confirm them with the agent's tool list before use.

## Read tools used for design to code

| Tool | Use it for |
| --- | --- |
| `get_libraries` | Lists subscribed and available component libraries |
| `search_design_system` | Finds components, variables, and styles by text query |
| `get_metadata` | Lightweight XML outline of a selection. Use first on large frames |
| `get_design_context` | Design context and code for one layer or selection |
| `get_variable_defs` | Variables and styles used in a selection |
| `get_screenshot` | Screenshot of a selection, for visual comparison |
| `get_code_connect_map` | Code Connect mappings for selected instances |
| `download_assets` | Exports and original images, up to 20 nodes per call |
| `get_motion_context` | Keyframe animation data and code snippets for a node |
| `export_video` | Exports an animated frame as MP4 |

## Call order

1. Run the `create_design_system_rules` prompt once and save its output to the project's `rules/` or `instructions/` folder.
2. `get_libraries` and `search_design_system` to find existing components.
3. `get_metadata` on the frame, then `get_design_context` on the nodes to build.
4. `get_variable_defs` for tokens, `get_screenshot` for comparison, `download_assets` for icons and images.
5. For animations, `get_motion_context` with the same node ID, then `export_video` or `download_assets`.

Write tools (`use_figma`, `generate_figma_design`, `send_code_to_figma`, `add_code_connect_map`) change the Figma file or create new content. Use them only when the user asks for a change in Figma.

## Variables REST API

| Method | Path | Scope | Notes |
| --- | --- | --- | --- |
| GET | `/v1/files/:file_key/variables/local` | `file_variables:read` | Local and remote variables used in the file. Includes modes |
| GET | `/v1/files/:file_key/variables/published` | `file_variables:read` | Published variables. Modes are omitted |
| POST | `/v1/files/:file_key/variables` | `file_variables:write` | Bulk create, update, and delete. Requires edit access |

- Local responses list `variableCollections[].modes` with `modeId` and `name`. Each variable's `valuesByMode` is keyed by `modeId`.
- An alias value is `{ "type": "VARIABLE_ALIAS", "id": ... }` when writing. Resolve aliases to final values before generating CSS.
- To read light and dark values, use the local endpoint. Published data does not include modes.
- These endpoints are available to full members of Enterprise organizations, according to the documentation.

## Mapping variables to tokens

```css
/* Figma collection "Color", modes: Light, Dark */
:root {
  --surface: #ffffff;
  --text: #111418;
}
[data-theme="dark"] {
  --surface: #14161a;
  --text: #f2f3f5;
}
```

Keep the token names from the codebase. When a Figma name differs, map the Figma variable to the existing token instead of adding a duplicate.
