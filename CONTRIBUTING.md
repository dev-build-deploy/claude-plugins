<!--
SPDX-FileCopyrightText: 2026 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
-->

# Contributing

## Git hooks

This repository has no `package.json`, so the git hooks do not install on `npm install`. Install
[pre-commit](https://pre-commit.com) and [actionlint](https://github.com/rhysd/actionlint)
(`brew install pre-commit actionlint`), then run once per clone:

```sh
pre-commit install --hook-type pre-commit --hook-type commit-msg
```

The hooks check your commit message (commit-me, against `.github/.commit-me.json`), the REUSE licensing
headers (reuse-me) and the GitHub workflows (actionlint).
