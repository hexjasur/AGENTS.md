# Security policy

## Supported versions

Only the latest published version of `@hexjasur/agents-md` receives security fixes.

## Reporting a vulnerability

Please report vulnerabilities **privately** through GitHub:
[Report a vulnerability](https://github.com/hexjasur/AGENTS.md/security/advisories/new).

Do not open a public issue or pull request for a suspected vulnerability. Include:

- What is affected (installer, a specific skill, or the release process).
- Steps to reproduce, or a proof of concept.
- The impact you expect.

You can expect an acknowledgement within a few days. Fixes are published as a new version with credit to the reporter if you want it.

## Scope

In scope:

- **The installer CLI** (`bin/`, `lib/`): path traversal, symbolic-link or permission handling, unsafe file overwrites or deletes, and anything that writes outside the target project.
- **Skill and `AGENTS.md` content** that could lead an agent to unsafe behavior: leaking secrets, disabling security controls, running untrusted remote code, or following instructions from untrusted content.
- **The release workflow and published archives**: tampering, missing integrity checks, or excessive permissions.

Out of scope: vulnerabilities in third-party tools the skills mention, and issues that require an attacker to already control the user's machine.

## Verifying releases

Each GitHub Release publishes `SHA256SUMS.txt` for the downloadable archives. Verify downloads before extracting:

```sh
sha256sum -c SHA256SUMS.txt
```

GitHub Release archives also have build-provenance attestations. Verify an archive with GitHub CLI:

```sh
gh attestation verify agents-md-skills-vX.Y.Z.zip --repo hexjasur/AGENTS.md
```

The npm package is published from GitHub Actions using OIDC trusted publishing and npm provenance; no long-lived npm publish token is stored in GitHub.
