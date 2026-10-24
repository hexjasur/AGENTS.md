# Release workflow reference

Load this when creating or fixing the release pipeline. Replace `OWNER/REPO`, the product name, and the platform list for the app being built. Pin every `uses:` line to a full commit SHA before shipping; the versions below follow the official Tauri docs at the time of writing.

## Version check script

`scripts/check-version.ts` (run with Bun, or `tsx`). It fails when versions disagree or the changelog has no entry.

```ts
import { readFileSync } from 'node:fs';

const read = (file: string) => readFileSync(file, 'utf8');
const pkg = JSON.parse(read('package.json')).version as string;
const tauri = JSON.parse(read('src-tauri/tauri.conf.json')).version as string | undefined;
const cargo = /^version\s*=\s*"([^"]+)"/m.exec(read('src-tauri/Cargo.toml'))?.[1];
const changelog = read('CHANGELOG.md');

const versions = { 'package.json': pkg, 'tauri.conf.json': tauri ?? pkg, 'Cargo.toml': cargo };
const unique = new Set(Object.values(versions));
if (unique.size !== 1 || unique.has(undefined)) {
  console.error('Version mismatch:', versions);
  process.exit(1);
}
const escaped = pkg.replace(/\./g, '\\.');
if (!new RegExp(`^##\\s+\\[?v?${escaped}\\]?`, 'm').test(changelog)) {
  console.error(`CHANGELOG.md has no entry for ${pkg}`);
  process.exit(1);
}
console.log(pkg);
```

If `tauri.conf.json` omits `version`, Tauri reads it from `Cargo.toml`; keep the script's fallback in sync with how your project does it.

## Release workflow template

`.github/workflows/release.yml`

```yaml
name: release

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      force:
        description: Rebuild even if the tag already exists
        type: boolean
        default: false

concurrency:
  group: release
  cancel-in-progress: false

permissions:
  contents: read

jobs:
  check-version:
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.version.outputs.version }}
      should_release: ${{ steps.tag.outputs.should_release }}
    steps:
      - uses: actions/checkout@v7
      - uses: oven-sh/setup-bun@v2
      - id: version
        run: echo "version=$(bun scripts/check-version.ts)" >> "$GITHUB_OUTPUT"
      - id: tag
        env:
          VERSION: ${{ steps.version.outputs.version }}
          FORCE: ${{ inputs.force }}
        run: |
          if git ls-remote --exit-code --tags origin "refs/tags/v${VERSION}" >/dev/null 2>&1 && [ "$FORCE" != "true" ]; then
            echo "Tag v${VERSION} already exists; skipping release."
            echo "should_release=false" >> "$GITHUB_OUTPUT"
          else
            echo "should_release=true" >> "$GITHUB_OUTPUT"
          fi

  create-release:
    needs: check-version
    if: needs.check-version.outputs.should_release == 'true'
    runs-on: ubuntu-latest
    permissions:
      contents: write
    outputs:
      release_id: ${{ steps.create.outputs.release_id }}
    steps:
      - id: create
        env:
          GH_TOKEN: ${{ github.token }}
          TAG: v${{ needs.check-version.outputs.version }}
        run: |
          id=$(gh api "repos/${GITHUB_REPOSITORY}/releases" \
            -f tag_name="$TAG" -f name="App $TAG" -f target_commitish="$GITHUB_SHA" \
            -F draft=true -F prerelease=false --jq .id)
          echo "release_id=$id" >> "$GITHUB_OUTPUT"

  build:
    needs: [check-version, create-release]
    permissions:
      contents: write
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: windows-latest
            args: ''
          - platform: ubuntu-22.04
            args: ''
    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v7
      - name: Install Linux dependencies
        if: matrix.platform == 'ubuntu-22.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf xdg-utils
      - uses: oven-sh/setup-bun@v2
      - uses: dtolnay/rust-toolchain@stable
      - uses: swatinem/rust-cache@v2
        with:
          workspaces: './src-tauri -> target'
      - run: bun install --frozen-lockfile
      - uses: tauri-apps/tauri-action@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
        with:
          releaseId: ${{ needs.create-release.outputs.release_id }}
          tagName: v${{ needs.check-version.outputs.version }}
          releaseDraft: true
          args: ${{ matrix.args }}

  publish:
    needs: [check-version, create-release, build]
    runs-on: ubuntu-latest
    permissions:
      contents: write
    env:
      GH_TOKEN: ${{ github.token }}
      RELEASE_ID: ${{ needs.create-release.outputs.release_id }}
      VERSION: ${{ needs.check-version.outputs.version }}
      REQUIRED_PLATFORMS: windows-x86_64 linux-x86_64
    steps:
      - name: Verify latest.json
        run: |
          asset=$(gh api "repos/${GITHUB_REPOSITORY}/releases/${RELEASE_ID}/assets" --jq '.[] | select(.name=="latest.json") | .id')
          test -n "$asset" || { echo "latest.json is missing"; exit 1; }
          gh api -H "Accept: application/octet-stream" "repos/${GITHUB_REPOSITORY}/releases/assets/${asset}" > latest.json
          jq -e --arg v "$VERSION" '(.version | ltrimstr("v")) == $v' latest.json >/dev/null
          for p in $REQUIRED_PLATFORMS; do
            jq -e --arg p "$p" '.platforms[$p].url | startswith("https://")' latest.json >/dev/null || { echo "missing platform $p"; exit 1; }
            jq -e --arg p "$p" '.platforms[$p].signature | length > 0' latest.json >/dev/null || { echo "empty signature for $p"; exit 1; }
          done
      - name: Publish release
        run: gh api -X PATCH "repos/${GITHUB_REPOSITORY}/releases/${RELEASE_ID}" -F draft=false -f make_latest=true
```

Notes:

- Add a `macos-latest` matrix entry with `--target aarch64-apple-darwin` (and an Intel target if needed) when you ship macOS, and add the platform keys to `REQUIRED_PLATFORMS`.
- With `releaseDraft: true`, `releaseId`, and `tagName`, `tauri-action` uploads installers, `.sig` files, and `latest.json` to the draft; each matrix job adds its own platform. Inspect the final `latest.json` once manually to confirm every platform is present.
- `tauri-action` uses `updaterJsonPreferNsis: false` by default for legacy reasons. Set it to `true` if you ship the NSIS `-setup.exe` and want the updater to use it instead of the MSI.
- If the workflow needs "Read and write permissions", enable them under repository Settings, Actions, General, Workflow permissions.

## Optional: custom manifest generator

Use this only when `tauri-action`'s generated `latest.json` is not enough (for example, release notes from `CHANGELOG.md`). It builds the manifest from a folder of downloaded assets and fails if a required platform is missing.

`scripts/generate-updater-manifest.ts`

```ts
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [dir, repo, tag, notesFile] = process.argv.slice(2);
if (!dir || !repo || !tag) throw new Error('usage: generate-updater-manifest <assetsDir> <owner/repo> <tag> [notesFile]');

// Add macOS rules for your artifact naming if you ship macOS.
const rules = [
  { platform: 'windows-x86_64', match: /_x64-setup\.exe$/ },
  { platform: 'linux-x86_64', match: /_amd64\.AppImage$/ },
];

const files = readdirSync(dir);
const platforms: Record<string, { signature: string; url: string }> = {};
for (const { platform, match } of rules) {
  const asset = files.find((file) => match.test(file));
  if (!asset) continue;
  if (!files.includes(`${asset}.sig`)) throw new Error(`Missing signature for ${asset}`);
  platforms[platform] = {
    signature: readFileSync(join(dir, `${asset}.sig`), 'utf8').trim(),
    url: `https://github.com/${repo}/releases/download/${tag}/${encodeURIComponent(asset)}`,
  };
}

const required = (process.env.REQUIRED_PLATFORMS ?? 'windows-x86_64 linux-x86_64').split(/[\s,]+/);
const missing = required.filter((platform) => !(platform in platforms));
if (missing.length > 0) throw new Error(`Missing platforms: ${missing.join(', ')}`);

const manifest = {
  version: tag.replace(/^v/, ''),
  notes: notesFile ? readFileSync(notesFile, 'utf8').trim() : '',
  pub_date: new Date().toISOString(),
  platforms,
};
writeFileSync(join(dir, 'latest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
```

## Sources

- [Tauri updater plugin](https://v2.tauri.app/plugin/updater/)
- [Tauri GitHub Actions pipeline](https://v2.tauri.app/distribute/pipelines/github/)
- [tauri-action](https://github.com/tauri-apps/tauri-action)
