#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
if ! command -v node >/dev/null 2>&1; then
  printf 'Error: Node.js 18 or later is required. Install it and ensure it is available on PATH.\n' >&2
  exit 1
fi

node_major=$(node -p 'process.versions.node.split(".")[0]')
if [ "$node_major" -lt 18 ]; then
  printf 'Error: Node.js 18 or later is required; found Node.js %s.\n' "$(node --version)" >&2
  exit 1
fi

exec node "$script_dir/bin/cli.js" "$@"
