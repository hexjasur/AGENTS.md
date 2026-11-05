# LLM agent patterns

Load this after `SKILL.md` when implementing or reviewing a chat or agent feature. Treat the snippets as starting points and check them against the provider's current documentation.

## Provider call (OpenAI-compatible, such as OpenRouter)

```ts
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  signal: controller.signal,
  headers: {
    Authorization: `Bearer ${apiKey}`, // read from the secret store at call time
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model,                 // from user settings, not hardcoded
    messages,
    stream: true,
    max_tokens: 2048,      // always set explicitly
    tools,                 // omit when the model does not support tools
  }),
});
if (!response.ok) throw await toProviderError(response); // status, code, Retry-After
```

- Keep the key out of the webview. In a Tauri app, make this call in a Rust command and emit chunks to the frontend as events, so the key never crosses the IPC boundary.
- Add `HTTP-Referer` and `X-Title` headers only if you want app attribution; they are optional and not secrets.

## Streaming parser

- Read the body as a stream, split on newlines, handle lines starting with `data: `, ignore comment lines (starting with `:`), and stop at `data: [DONE]`.
- Buffer incomplete lines across chunks; a chunk boundary can split a JSON object.
- Accumulate `delta.content` for text and `delta.tool_calls[i].function.arguments` for tools, keyed by `index`. Parse arguments once `finish_reason` is `tool_calls`.
- Surface mid-stream errors (an `error` object in a chunk) as a failed message, not as silent truncation.
- Throttle UI updates (one per animation frame) so long streams do not freeze rendering.

## Tool definition

```json
{
  "type": "function",
  "function": {
    "name": "read_file",
    "description": "Read a UTF-8 text file inside the project. Returns at most 200 lines starting at `start_line`.",
    "parameters": {
      "type": "object",
      "properties": {
        "path": { "type": "string", "description": "Path relative to the project root" },
        "start_line": { "type": "integer", "minimum": 1 }
      },
      "required": ["path"],
      "additionalProperties": false
    }
  }
}
```

- One purpose per tool. Prefer `read_file`, `list_dir`, `search_text`, `apply_patch` over a generic `run_command`.
- Describe limits in the description so the model plans around them (line caps, size caps, excluded folders).
- Return errors as short, actionable text (`path outside project root`, `file larger than 1 MB; use start_line`).

## Safe path resolution

```ts
function resolveInside(root: string, requested: string): string {
  const full = realpathSync(path.resolve(root, requested)); // resolves symlinks
  const rootReal = realpathSync(root);
  if (full !== rootReal && !full.startsWith(rootReal + path.sep)) {
    throw new ToolError('path outside project root');
  }
  return full;
}
```

- Do the equivalent in Rust with `canonicalize` and `starts_with`. For files that do not exist yet, canonicalize the parent.
- Default-deny `.git/`, `.env*`, key files, `node_modules/`, and build output. Let the user adjust the list.
- Cap file size and line count per read; mark binary files as unreadable.

## Agent loop

```text
messages = [system, user_task]
for step in 1..MAX_STEPS:
    reply = call_model(messages, tools, max_tokens)
    messages.append(reply)
    if no tool_calls: return reply            # done
    for call in reply.tool_calls:
        validate(call.arguments, schema)       # reject on mismatch
        if needs_confirmation(call): ask_user(call)   # show exact diff or command
        result = run_tool(call)                # sandboxed, time-limited
        messages.append(tool_result(call.id, truncate(result)))
    if budget_exceeded() or user_cancelled(): stop
stop with a clear "step limit reached" message
```

- Truncate tool results to a fixed size and say so (`[truncated, 12,400 more characters]`).
- Keep a per-run record of tool calls so the user can review and undo.
- Stop on repeated identical failing calls instead of retrying forever.

## Confirmation rules

| Action | Default |
| --- | --- |
| Read, list, search inside the project root | Automatic |
| Create or edit a file | Show diff, confirm, or apply to a git branch or backup |
| Delete or move files | Always confirm |
| Shell command | Allowlist commands; confirm each; no network by default |
| Anything outside the root, or sending data to a new host | Always confirm |

## Context and cost

- Keep a token estimate per message; warn at about 80 percent of the model's context and compact the middle of the history, never the system prompt or the latest task.
- Read models and per-token prices from the provider's model list at runtime; show cost as an estimate.
- Set a per-session spend limit and stop with a message when it is reached.

## Security checklist

- [ ] Key stored in the OS keychain or secret store; absent from the bundle, logs, and prompts
- [ ] Provider call made from trusted code; CSP restricts the webview's network access
- [ ] Tool arguments schema-validated; paths resolved and confined to the root
- [ ] Writes, deletes, and commands require confirmation with the exact diff or command
- [ ] Untrusted content fenced and never obeyed as instructions
- [ ] Model markdown sanitized; remote images blocked or proxied
- [ ] Iteration, token, time, and cost limits enforced; cancellation aborts the request
- [ ] Secrets files excluded from context by default; logging redacted and opt-in
- [ ] Tests cover malformed tool JSON, path escape, cancellation, and injected instructions

## Sources

- OpenRouter API reference and streaming: https://openrouter.ai/docs
- OpenRouter tool calling: https://openrouter.ai/docs/features/tool-calling
- OWASP Top 10 for LLM Applications: https://genai.owasp.org/llm-top-10/
- Model Context Protocol security best practices: https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices
- Tauri security and capabilities: https://v2.tauri.app/security/
