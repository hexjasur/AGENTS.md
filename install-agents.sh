#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
if ! command -v node >/dev/null 2>&1; then
  printf 'Xatolik: Node.js 18 yoki undan yangiroq versiyasi kerak.\n' >&2
  exit 1
fi
exec node "$script_dir/bin/cli.js" "$@"
