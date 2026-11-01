// SPDX-FileCopyrightText: 2026 Kevin de Jong <monkaii@hotmail.com>
// SPDX-License-Identifier: MIT

// Moves the release pins in .claude-plugin/marketplace.json to the latest release of each tool.
// Deterministic, no AI. The logic is here; the workflow only runs it and opens the pull request.
//
//   node scripts/bump-pins.mjs [--marketplace <file>] [--write] [--body <file>]
//
// Prints the changes as JSON. With --write the marketplace file is updated; with --body a pull
// request description is written. Needs the `gh` CLI (authenticated) for the real release data.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

/** The "owner/name" of the tool repository a plugin entry points to. */
export function repoOf(source) {
  if (source.repo) return source.repo;
  const match = /github\.com[/:]([^/]+\/[^/.]+?)(?:\.git)?$/.exec(source.url ?? "");
  if (!match) throw new Error(`cannot find the GitHub repository in ${JSON.stringify(source)}`);
  return match[1];
}

/** Where the plugin manifest must exist in a tag: at the repo root (`github`) or in `path` (`git-subdir`). */
export function manifestPath(source) {
  return `${source.path ? `${source.path}/` : ""}.claude-plugin/plugin.json`;
}

/** Parses "v1.2.3" (or "1.2.3") to [1, 2, 3]; null when the tag is not plain SemVer (e.g. a pre-release). */
export function parseTag(tag) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(tag ?? "");
  return match ? match.slice(1).map(Number) : null;
}

/** True when tag `a` is strictly newer than tag `b`. */
export function isNewer(a, b) {
  const x = parseTag(a);
  const y = parseTag(b);
  if (!x || !y) return false;
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];
  return false;
}

/**
 * Works out the bumps. `lookup` gives, per repository, `{ tag, url, hasManifest(path) }`
 * (the real one asks GitHub through `gh`; the tests pass a fake).
 * Returns { marketplace, changes }: the updated marketplace object and one entry per moved pin.
 */
export async function planBumps(marketplace, lookup) {
  const next = structuredClone(marketplace);
  const changes = [];
  for (const plugin of next.plugins) {
    const repo = repoOf(plugin.source);
    const release = await lookup(repo);
    if (!release || !isNewer(release.tag, plugin.source.ref)) continue;
    const path = manifestPath(plugin.source);
    if (!(await release.hasManifest(path))) {
      changes.push({ plugin: plugin.name, repo, from: plugin.source.ref, to: release.tag, skipped: `no ${path} in ${release.tag}` });
      continue;
    }
    changes.push({ plugin: plugin.name, repo, from: plugin.source.ref, to: release.tag, url: release.url });
    plugin.source.ref = release.tag;
  }
  return { marketplace: next, changes };
}

/** The pull request description (Why, How, Review hints, Proof) for the pins that moved. */
export function pullRequestBody(changes) {
  const moved = changes.filter((c) => !c.skipped);
  const list = moved.map((c) => `- ${c.plugin}: ${c.from} to ${c.to} ([release notes](${c.url}))`).join("\n");
  return `## Why

Each plugin in this marketplace is pinned to a release tag of its tool, so a Claude Code session runs
exactly the tool version we tested. A pin only changes when this repository changes. Tools have released since,
and the pins were moved by hand so far. This pull request moves them so users get the new releases.

${list}

## How

The workflow "Bump plugin pins" ran \`scripts/bump-pins.mjs\`. For each plugin it asked GitHub for the latest
release of the tool repository, checked that the tag contains the plugin manifest (\`plugin.json\`), and changed
\`ref\` in \`.claude-plugin/marketplace.json\` when the release is newer than the pin. It changes nothing else.
The workflow keeps one branch and one pull request; a later run updates them in place.

## Review hints

- Read the release notes linked above first. A major version can change what the plugin does.
- The diff must only touch \`ref\` lines.
- Pull requests opened with the workflow's default \`GITHUB_TOKEN\` do not start other workflows, so the required
  checks may not run on this one. If they are missing, close and reopen the pull request, or ask the owner to
  set the \`PLUGIN_BUMP_TOKEN\` secret (see the workflow file).

## Proof

\`\`\`text
${moved.map((c) => `${c.plugin}: ${c.from} -> ${c.to}`).join("\n")}
\`\`\`
`;
}

function gh(...args) {
  return execFileSync("gh", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

/** The real lookup: the latest non-draft, non-pre-release release of a repository, via the GitHub API. */
export async function ghLookup(repo) {
  let release;
  try {
    release = JSON.parse(gh("api", `repos/${repo}/releases/latest`));
  } catch {
    return null; // no release yet
  }
  return {
    tag: release.tag_name,
    url: release.html_url,
    hasManifest(path) {
      try {
        gh("api", `repos/${repo}/contents/${path}?ref=${release.tag_name}`, "--silent");
        return true;
      } catch {
        return false;
      }
    },
  };
}

async function main(argv) {
  const arg = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined);
  const file = arg("--marketplace") ?? ".claude-plugin/marketplace.json";
  const { marketplace, changes } = await planBumps(JSON.parse(readFileSync(file, "utf8")), ghLookup);
  if (argv.includes("--write") && changes.some((c) => !c.skipped)) {
    writeFileSync(file, `${JSON.stringify(marketplace, null, 2)}\n`);
  }
  if (arg("--body") && changes.some((c) => !c.skipped)) writeFileSync(arg("--body"), pullRequestBody(changes));
  process.stdout.write(`${JSON.stringify(changes, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main(process.argv.slice(2));
