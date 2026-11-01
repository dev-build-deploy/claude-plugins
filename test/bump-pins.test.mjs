// SPDX-FileCopyrightText: 2026 Kevin de Jong <monkaii@hotmail.com>
// SPDX-License-Identifier: MIT

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { isNewer, manifestPath, planBumps, pullRequestBody, repoOf } from "../scripts/bump-pins.mjs";

const marketplace = JSON.parse(readFileSync(new URL("./fixtures/marketplace.json", import.meta.url), "utf8"));

// Fake release data: what GitHub would answer per repository.
const releases = {
  "dev-build-deploy/commit-me": { tag: "v2.2.0", manifests: [".claude-plugin/plugin.json"] },
  "dev-build-deploy/reuse-me": { tag: "v1.4.0", manifests: [] }, // newer, but the tag has no manifest
  "dev-build-deploy/secret-me": { tag: "v0.1.0", manifests: ["claude-plugin/.claude-plugin/plugin.json"] }, // same as the pin
  "dev-build-deploy/pull-me": { tag: "v0.2.0-rc.1", manifests: ["claude-plugin/.claude-plugin/plugin.json"] }, // pre-release tag
};
const lookup = async (repo) => {
  const r = releases[repo];
  return r && { tag: r.tag, url: `https://example.test/${repo}/${r.tag}`, hasManifest: async (p) => r.manifests.includes(p) };
};

test("repoOf and manifestPath read both source shapes", () => {
  assert.equal(repoOf(marketplace.plugins[0].source), "dev-build-deploy/commit-me");
  assert.equal(repoOf(marketplace.plugins[1].source), "dev-build-deploy/reuse-me");
  assert.equal(manifestPath(marketplace.plugins[0].source), ".claude-plugin/plugin.json");
  assert.equal(manifestPath(marketplace.plugins[1].source), "claude-plugin/.claude-plugin/plugin.json");
});

test("isNewer compares numbers, not strings, and ignores non-SemVer tags", () => {
  assert.ok(isNewer("v1.10.0", "v1.9.0"));
  assert.ok(!isNewer("v1.2.1", "v1.2.1"));
  assert.ok(!isNewer("v1.2.0", "v1.2.1"));
  assert.ok(!isNewer("v2.0.0-rc.1", "v1.0.0"));
});

test("planBumps moves only newer pins whose tag has the manifest", async () => {
  const { marketplace: next, changes } = await planBumps(marketplace, lookup);
  assert.deepEqual(changes.map((c) => [c.plugin, c.to, c.skipped ?? null]), [
    ["commit-me", "v2.2.0", null],
    ["reuse-me", "v1.4.0", "no claude-plugin/.claude-plugin/plugin.json in v1.4.0"],
  ]);
  assert.deepEqual(next.plugins.map((p) => p.source.ref), ["v2.2.0", "v1.2.1", "v0.1.0", "v0.1.1"]);
  assert.equal(marketplace.plugins[0].source.ref, "v2.1.1", "the input is not changed");
});

test("the pull request body has the four sections and links the release notes", async () => {
  const { changes } = await planBumps(marketplace, lookup);
  const body = pullRequestBody(changes);
  for (const h of ["## Why", "## How", "## Review hints", "## Proof"]) assert.ok(body.includes(h), h);
  assert.ok(body.includes("[release notes](https://example.test/dev-build-deploy/commit-me/v2.2.0)"));
  assert.ok(!body.includes("reuse-me"), "a skipped bump is not in the description");
});
