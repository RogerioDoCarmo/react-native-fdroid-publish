---
name: react-native-fdroid-publish
description: Publish a React Native or Expo Android app on F-Droid, end to end. Use when making an app F-Droid-compliant (removing Firebase, Google Play Services, ML Kit, expo-updates, prebuilt AARs), setting up a build mirror for fdroiddata, writing or fixing an fdroiddata recipe, opening the RFP and merge request on GitLab (glab), reading a failed F-Droid pipeline or Code Quality findings, or answering an F-Droid reviewer and explaining RFP/MR statuses.
---

# Publish a React Native app on F-Droid

F-Droid builds every app **from source on its own servers** and signs it with its own key. You do
not upload an APK: you submit a **recipe** (one YAML file in `fdroiddata`) that tells their build
server how to compile your source. Everything below exists to make that build possible and to get
the recipe accepted.

Two apps have been through this; every rule here comes from one of them. Read
[references/case-studies.md](references/case-studies.md) when a step's _why_ matters.

## Ground rules

- **Acceptance beats parity.** The F-Droid build may lose features. Removing a feature cleanly is
  normal; shipping a proprietary library is a rejection.
- **Removed, not hidden.** A disabled feature leaves the APK: code, native module, manifest entry,
  permission. F-Droid's scanner and reviewers read what is compiled in.
- **The owner decides anything public or lossy.** Which features go, the store copy, and every
  text posted on GitLab are shown to the owner and approved before they are sent.
- **Credentials stay with the owner.** Tokens, keystores and logins are created and entered by the
  owner; you check for a secret by name only.
- **Prove, then claim.** Every "clean", "builds" or "no INTERNET" in a document or a GitLab text is
  backed by a check you ran ([references/local-verification.md](references/local-verification.md)).

## Steps

Work through them in order. Each ends on a completion criterion; do not start the next step until
it holds.

### 1. Survey the project

Fill in the **project sheet** in [references/project-sheet.md](references/project-sheet.md):
Expo managed or bare, SDK and React Native versions, package manager, application ID, licence,
source repo, store links, locales, every native dependency.

**Done when** every field of the sheet has a value read from the project, not assumed.

### 2. Audit what F-Droid would reject

Classify every native dependency and every network use with
[references/inclusion-audit.md](references/inclusion-audit.md): _keep_, _patch_, _remove_, or
_keep with an anti-feature_.

**Done when** each dependency on the sheet has a class and a reason, and the owner has approved the
list of features the F-Droid build loses.

### 3. Build the F-Droid variant (skip when nothing is removed)

Follow [references/build-variant.md](references/build-variant.md): one switch table, read by the
Expo config, Metro, the adapter wiring and the screens, with the store build byte-identical to
before.

**Done when** the store build's resolved config and release manifest are unchanged, and the F-Droid
variant's prebuild contains none of the removed packages.

### 4. Patch what cannot be removed

Expo modules that drag Google libraries along (expo-camera's ML Kit, expo-application's Install
Referrer) are patched at build time: [references/native-patches.md](references/native-patches.md).

**Done when** each patch applies cleanly to the exact `node_modules` the lockfile installs.

### 5. Set up the build mirror

An Expo app has no committed `android/`. A CI workflow regenerates a plain-Gradle snapshot into a
separate public repo on each release: [references/build-mirror.md](references/build-mirror.md),
starting from [templates/android-mirror.yml](templates/android-mirror.yml) and
[templates/assemble-mirror.sh](templates/assemble-mirror.sh).

**Done when** a mirror run is green and a fresh clone of the mirror shows the real `versionCode`,
`node-linker=hoisted`, `buildFromSource: [".*"]`, Fastlane metadata, and none of the removed
packages in `package.json` or the lockfile.

### 6. Verify locally

Run every check in [references/local-verification.md](references/local-verification.md) on a tree
taken through the mirror's steps: prebuild grep, a release build with every Expo
`local-maven-repo` deleted, `dexdump`, `aapt2` permissions, and `fdroid scanner` on the APK and the
source.

**Done when** each check has passed and its numbers are written down where the merge request can
quote them.

### 7. Put a test build on a real phone

Build a side-by-side test APK with its own application ID, so it installs beside the store build:
[references/test-builds.md](references/test-builds.md).

**Done when** the owner reports the test build working on a physical device.

### 8. Write the recipe

Start from [templates/recipe.yml](templates/recipe.yml) and
[references/recipe.md](references/recipe.md). Pin the mirror's full commit hash.

**Done when** every field is filled from the project sheet and the mirror run, no summary or
description is in the recipe, and the `scanignore` entries match the source scan from step 6.

### 9. Submit on GitLab

Fork `fdroiddata`, open the RFP, add the recipe on a branch, open the merge request:
[references/gitlab.md](references/gitlab.md). Write every text by
[references/writing-for-fdroid.md](references/writing-for-fdroid.md), from
[templates/rfp.md](templates/rfp.md) and [templates/merge-request.md](templates/merge-request.md),
and show each one to the owner before it is posted.

**Done when** the merge request is open, references the RFP with `Closes rfp#N`, and allows commits
from members who can merge.

### 10. Get the pipeline green

Read the failed job's log, find the first real error, fix the recipe on the fork branch, push:
[references/pipeline-failures.md](references/pipeline-failures.md) lists every failure seen so far.

**Done when** every job in the merge request's pipeline has passed, `fdroid build` included, and
each Code Quality finding is explained
([references/review-and-statuses.md](references/review-and-statuses.md)).

### 11. Through review

Answer reviewer comments promptly and briefly, push fixes to the same branch, and tell the owner
what each status and label means:
[references/review-and-statuses.md](references/review-and-statuses.md).

**Done when** the merge request is merged. A new upstream release before then means a new build
entry in the same merge request.

### 12. After it is published

Add an F-Droid section to the privacy policy, the F-Droid badge to the mirror's README and the
project's README, and confirm the next plain release updates the mirror by itself:
[references/after-publishing.md](references/after-publishing.md).

**Done when** the app's F-Droid page is live and the next release reached it without manual steps.
