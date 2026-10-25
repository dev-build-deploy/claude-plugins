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
| `reuse-me` | [reuse-me](https://github.com/dev-build-deploy/reuse-me) | Planned: copyright and licence headers on new files. |
| `release-me` | [release-me](https://github.com/dev-build-deploy/release-me) | Planned. |
| `plan-me` | plan-me | Planned. |
| `docs-me` | docs-me | Planned. |

The planned ones are added to `.claude-plugin/marketplace.json` as they come.

## Install

```text
/plugin marketplace add dev-build-deploy/claude-plugins
/plugin install commit-me@dev-build-deploy
```

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
    "commit-me@dev-build-deploy": true
  }
}
```

## Workflows

Like the other org repositories, pull requests are checked with
[commit-me](https://github.com/dev-build-deploy/commit-me) (Conventional Commits, configured in
[`.github/.commit-me.json`](.github/.commit-me.json)) and [reuse-me](https://github.com/dev-build-deploy/reuse-me)
(copyright and licence headers).

## Adding a plugin

A plugin lives in its tool's repository (`.claude-plugin/`, `hooks/`, `skills/` at the root, beside the tool's source).
List it in `.claude-plugin/marketplace.json` with a `github` source (`{ "source": "github", "repo": "dev-build-deploy/<tool>" }`;
the marketplace cannot name a subfolder of another repository through that form, so the plugin sits at the root).

## License

- [MIT](./LICENSES/MIT.txt) © 2026 Kevin de Jong \<monkaii@hotmail.com\>
- [CC0-1.0](./LICENSES/CC0-1.0.txt) for configuration files
