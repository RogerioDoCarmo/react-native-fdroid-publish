# react-native-fdroid-publish

An agent skill that takes a **React Native or Expo** Android app all the way onto
[F-Droid](https://f-droid.org): auditing what F-Droid would reject, building an F-Droid variant,
patching Google libraries out of Expo modules, setting up the build mirror F-Droid compiles from,
verifying the build locally, writing the `fdroiddata` recipe, and handling the GitLab side: the
RFP, the merge request, the pipeline, Code Quality findings and the reviewer's questions.

It is distilled from two real submissions, so you don't re-learn either of them:
[Miroji](https://gitlab.com/fdroid/fdroiddata/-/merge_requests/43165) (merged) and
[OmniMorse](https://gitlab.com/fdroid/fdroiddata/-/merge_requests/54504) (closed: an outdated
merge request template, and an app under three months old). Every rule in it came from one of
those two, and the skill says which.

## Install

Works with any agent that reads the [Agent Skills](https://agentskills.io) format (`SKILL.md`):
Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode and others.

**Any agent, with the skills CLI** ([skills.sh](https://skills.sh)):

```bash
npx skills add RogerioDoCarmo/react-native-fdroid-publish
```

**Claude Code, as a plugin:**

```text
/plugin marketplace add RogerioDoCarmo/react-native-fdroid-publish
/plugin install react-native-fdroid-publish@rogeriodocarmo
```

**By hand:** copy `skills/react-native-fdroid-publish/` into your agent's skills directory (for
Claude Code, `~/.claude/skills/` or `.claude/skills/` in a project).

Then ask your agent something like _"publish this app on F-Droid"_, _"why did the F-Droid pipeline
fail?"_ or _"what does this RFP status mean?"_.

## What's inside

```text
skills/react-native-fdroid-publish/
├── SKILL.md            the twelve steps, each with a completion criterion
├── references/         one file per step: audit, variant, patches, mirror, verification,
│                       test builds, recipe, GitLab, writing conventions, pipeline failures,
│                       review and statuses, after publishing, case studies
├── templates/          mirror workflow, assemble script, recipe, RFP, merge request, comment
├── scripts/            glab-fdroid.mjs (GitLab steps), scan_source.py (F-Droid's source scanner)
└── examples/patches/   expo-camera without ML Kit, expo-application without Install Referrer
```

## What it runs and sends

The skill is instructions and templates; your agent runs the commands it describes, in your
project, with your approval. Specifically:

- **`scripts/glab-fdroid.mjs`** calls `glab api` against gitlab.com with **your own** `glab` login:
  it forks `fdroid/fdroiddata`, creates a branch and the recipe file in your fork, opens the RFP,
  comments on it, opens the merge request, and reads pipeline status. It never reads, prints or
  stores a token. Every public text is shown to you before it is posted, and refused if it drops a
  line of F-Droid's current template or names another app store.
- **`glab-fdroid.mjs template` and `check`** download F-Droid's current RFP and merge request
  templates from gitlab.com (public files, no login) so every text starts from the live version.
- **`scripts/scan_source.py`** runs F-Droid's own `fdroidserver` scanner on a local directory.
  Nothing leaves your machine.
- Read-only status checks may use `curl` against gitlab.com's public API.
- The templates are files you add to your own repository (a GitHub Actions workflow that pushes a
  snapshot to a mirror repository you own, with a token you create).

Nothing is sent anywhere else.

## Requirements

- A React Native or Expo project with an Android build.
- A GitHub repository for the source and one for the build mirror (Expo managed projects).
- A gitlab.com account, verified by phone, and [`glab`](https://gitlab.com/gitlab-org/cli).
- For local verification: the Android SDK build-tools, a JDK, and Python for `fdroidserver`.

Proven on Expo SDK 54 (React Native 0.81) and SDK 57 (React Native 0.86) with pnpm. Bare React
Native projects and npm or yarn work with the substitutions the references point out.

## Contributing

Found a new pipeline failure, a new reviewer request, or a module that needs a patch? Open an issue
or a pull request with the log line and the fix; `references/pipeline-failures.md` and
`references/recipe.md` are the places they go. Run `node scripts/check.mjs` before pushing.

## License

[MIT](LICENSE)
