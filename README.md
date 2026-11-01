<!--
SPDX-FileCopyrightText: 2026 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
-->

# dev-build-deploy Claude Code plugins

The plugin marketplace of the [dev-build-deploy](https://github.com/dev-build-deploy) tools. Each `-me` tool
(deterministic, no AI) has a thin [Claude Code](https://claude.com/claude-code) plugin that makes a Claude session get it
right *before* a commit or a push, so CI does not reject it afterwards. The plugins hold no logic of their own: they run
the tool.

## Plugins

| Plugin | Tool | What it does |
| --- | --- | --- |
| `commit-me` | [commit-me](https://github.com/dev-build-deploy/commit-me) | Validates the message of a `git commit` before it runs, plus a `conventional-commits` skill. |
| `reuse-me` | [reuse-me](https://github.com/dev-build-deploy/reuse-me) | Adds the right SPDX copyright and licence header to every new file, by the repo's `.reuse-me.json` rules, plus a `reuse-compliance` skill. |
| `secret-me` | [secret-me](https://github.com/dev-build-deploy/secret-me) | Denies a write, edit, `git commit` or `git push` that would carry a secret (gitleaks with the org's rules; findings redacted), plus a `handling-secrets` skill. |
| `pull-me` | [pull-me](https://github.com/dev-build-deploy/pull-me) | Denies a `gh pr create` or `gh pr edit` whose description misses Why, How, Review hints or Proof, or whose Proof has no evidence; warns once about unclear prose (Vale), plus a `writing-pull-requests` skill. |
| `release-me` | [release-me](https://github.com/dev-build-deploy/release-me) | Planned. |
| `plan-me` | [plan-me](https://github.com/dev-build-deploy/plan-me) | Serves plan-me's backlog and decision commands as MCP tools; denies `gh issue create`, `edit` and `close` (they bypass the board fields) and hand edits of the generated `docs/decisions.md` or issue forms; checks the decision files before `git commit`, plus a `working-with-plan-me` skill. Every repository using plan-me must enable it (`plan-me claude install`; the Action checks it). |
| `docs-me` | [docs-me](https://github.com/dev-build-deploy/docs-me) | Planned. |

The planned ones are added to `.claude-plugin/marketplace.json` as they come.

## Install

```text
/plugin marketplace add dev-build-deploy/claude-plugins
/plugin install commit-me@dev-build-deploy
/plugin install reuse-me@dev-build-deploy
/plugin install secret-me@dev-build-deploy
/plugin install pull-me@dev-build-deploy
/plugin install plan-me@dev-build-deploy
```

Each plugin is pinned to a release of its tool (`ref` in `.claude-plugin/marketplace.json`), so it changes only
when that tool releases.

## Enable for every session of a repository

Commit this to the repository's `.claude/settings.json`; everyone who trusts the folder is asked to install the
marketplace and the plugin is on in each session:

```json
{
  "extraKnownMarketplaces": {
    "dev-build-deploy": {
      "source": { "source": "github", "repo": "dev-build-deploy/claude-plugins" }
    }
  },
  "enabledPlugins": {
    "commit-me@dev-build-deploy": true,
    "reuse-me@dev-build-deploy": true,
    "secret-me@dev-build-deploy": true,
    "pull-me@dev-build-deploy": true,
    "plan-me@dev-build-deploy": true
  }
}
```

## Workflows

Like the other org repositories, pull requests are checked with
[commit-me](https://github.com/dev-build-deploy/commit-me) (Conventional Commits, configured in
[`.github/.commit-me.json`](.github/.commit-me.json)) and [reuse-me](https://github.com/dev-build-deploy/reuse-me)
(copyright and licence headers).

## Adding a plugin

A plugin lives in its tool's repository, in a `claude-plugin/` folder (`.claude-plugin/plugin.json`, `hooks/`,
`skills/`, a `bundle/` of the tool when the hooks run it). List it in `.claude-plugin/marketplace.json` with a
`git-subdir` source pinned to a release (`{ "source": "git-subdir", "url": "https://github.com/dev-build-deploy/<tool>.git",
"path": "claude-plugin", "ref": "vX.Y.Z" }`); `scripts/bump-pins.mjs` moves the pins as the tools release.

## License

- [MIT](./LICENSES/MIT.txt) © 2026 Kevin de Jong \<monkaii@hotmail.com\>
- [CC0-1.0](./LICENSES/CC0-1.0.txt) for configuration files
