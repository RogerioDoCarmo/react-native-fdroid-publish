# Pipeline failures

How to read a red merge-request pipeline, and every failure seen so far with its fix.

## Reading the log

1. Find the failed job (`node glab-fdroid.mjs status ...`, or the pipeline page).
2. Download the raw log: `curl -sL https://gitlab.com/<user>/<fork>/-/jobs/<id>/raw -o job.log`.
3. Search for the **first** real error, not the last line: `grep -nE 'What went wrong|FAILED|ERROR:|error:' job.log`.
   Lines like `node-error-ex` from `apt-get` are package names, not errors.
4. Read the 30 lines around it. Gradle prints `* What went wrong:` followed by the cause.
5. Fix the recipe, push with `put-recipe`, watch the new pipeline. Mirror the fix into the source
   repo's copy of the recipe in the same sitting.

A push to the fork branch runs a `push` pipeline; the merge request runs a `merge_request_event`
pipeline. Both test the same recipe; the MR's is the one reviewers see.

## Seen so far

| Symptom | Cause | Fix |
| --- | --- | --- |
| `[CXX1300] CMake '3.31.6' was not found in SDK, PATH, or by cmake.dir property` in `:expo-modules-core:configureCMake...` | the build image has no CMake; Gradle wants one exact version | `apt-get install -y ... cmake ninja-build` in `sudo` (Debian trixie ships 3.31.6). Check the requested version against what trixie ships |
| Pipeline fails immediately, "user not verified" | the fork owner has not verified their GitLab account | owner verifies by phone/SMS; ask a maintainer to re-run, or push again |
| Every `scanignore` entry reported "Unused" / "Non-exist" | pnpm's symlinked `node_modules/.pnpm/...` layout | `node-linker=hoisted` in the mirror's `.npmrc` |
| `Unused scanignore path` for one entry | the scanner no longer flags that file (Expo upgrade) | delete the entry; an unused entry is an error |
| Scanner flags a binary or a Gradle repo in `node_modules` | new dependency | add `scanignore` only if the build needs it, otherwise `scandelete` covers it; re-run `scan_source.py` locally |
| Inconsistent JVM target, Java 21 vs Kotlin 17 | a module hard-codes 17 after the RN Gradle plugin moved to 21 | `sed -i '/jvmTarget\|JavaVersion/s/17/21/'` on that module's `build.gradle` or `build.gradle.kts` |
| A `sed` in `prebuild` "worked" but nothing changed | the file was renamed (`build.gradle` → `.kts`) or the line moved | name the file that exists; check with `grep` after an upgrade |
| `patch` fails in `init`, hunks rejected | Expo upgraded the module | regenerate the patch against the new `node_modules` (`native-patches.md`) |
| `hermesc` not found or flagged | the path moved in React Native 0.86 | `node_modules/hermes-compiler/hermesc/linux64-bin` |
| `pnpm install --frozen-lockfile` fails | the mirror's `package.json` and lockfile disagree | remove packages with `pnpm remove` in the workflow, never by editing `package.json` |
| `fdroid lint` / `rewritemeta` fail | non-canonical YAML, comments, unknown category | run `fdroid rewritemeta <appId>` and `fdroid lint <appId>` in an fdroiddata clone, or match field order to an existing recipe |
| `checkupdates` fails | `UpdateCheckMode: Tags` finds no tag | the mirror has no `vX.Y.Z` tag yet, or the tag is not on the mirror's default branch |
| Build passes on your machine, fails on theirs with a toolchain pin | Android Studio wrote `gradle-daemon-jvm.properties` | delete it from the mirror snapshot |

## Done

The failed job's first real error is understood, the fix is on the fork branch and in the source
repo's copy, and the new pipeline has passed.
