# Local verification

Prove the F-Droid build before F-Droid's server does. Every claim later made in a merge request
("no INTERNET", "scanner clean") comes from a check on this page.

## The tree to test

Take a **clean export** (`git archive HEAD | tar -x -C /tmp/src`) through the mirror workflow's
steps by hand, or clone the mirror after a run. Then install and build it **outside the source
repository**, so no parent `node_modules` can mask a missing dependency. Use the recipe's own
install command (`pnpm install --frozen-lockfile --prod`) and apply the patches the way the recipe's
`init` does.

## The checks

| # | Check | Command (from the mirror's root) | Pass |
| --- | --- | --- | --- |
| 1 | Generated project is clean | `grep -rniE 'firebase\|crashlytics\|com\.google\.android\.gms\|google-services\|installreferrer\|mlkit\|expo\.modules\.updates' android --include='*.gradle' --include='*.kts' --include='*.xml' --include='*.properties'` | no output |
| 2 | Autolinking | `pnpm exec expo-modules-autolinking resolve --platform android` (or read the Gradle sync output) | only the modules you expect; none excluded |
| 3 | From source | `find node_modules -type d -name local-maven-repo -prune -exec rm -rf {} +`, then `cd android && ./gradlew assembleRelease` | `BUILD SUCCESSFUL` |
| 4 | Dex | `dexdump` over every `classes*.dex` in the APK, grep `Class descriptor` for `Lcom/google/firebase`, `Lcom/google/android/gms`, `Lcom/google/mlkit`, `Lcom/android/installreferrer`, `Lexpo/modules/updates`, `Lio/invertase`, `Lcom/google/android/play` | zero classes |
| 5 | Permissions | `aapt2 dump permissions app-release.apk` | exactly the expected list; `INTERNET` absent if stripped |
| 6 | Bundle | `unzip -p app-release.apk assets/index.android.bundle \| grep -c -E 'crashlytics\|u\.expo\.dev\|expo-updates'` | 0 |
| 7 | APK scan | `fdroid scanner --refresh --exit-code app-release.apk` | exit 0 |
| 8 | Source scan | [../scripts/scan_source.py](../scripts/scan_source.py) on the tree after `init`, once with no lists, once with the recipe's `scanignore`/`scandelete` | with lists: 0 problems, no "Unused scanignore" |
| 9 | Build after the scan | `assembleRelease` again on the tree the scanner left | `BUILD SUCCESSFUL`, same permissions |

The `com.google.*` classes that legitimately remain are Material Components, Guava, Gson, Error
Prone annotations and AutoValue, all Apache-2.0.

Check 8 then 9 is the test that the scan lists are right: too little in `scanignore` and the build
breaks; too much and the scanner reports the entry unused, which is an error.

## Tools

- `fdroidserver` from PyPI in an isolated venv: `python -m venv .fdsvenv && .fdsvenv/bin/pip install
  fdroidserver` (Windows: `.fdsvenv\Scripts\pip`). Run scripts with `python -I`.
- `dexdump`, `aapt2`, `apksigner`: Android SDK `build-tools/<version>/`.
- JDK 17 locally is fine for checks 1–9; F-Droid builds with **JDK 21**, which only its pipeline
  proves (see `recipe.md` for the JDK 21 edits).
- Bundle with Node 20 once if you can: Debian trixie ships Node 20.19, and that is what F-Droid's
  build server installs.

⚠️ Windows: pass `PYTHONIOENCODING=utf-8` (or `sys.stdout.reconfigure(encoding="utf-8")` under
`python -I`, which ignores the variable) or output with non-ASCII text crashes in `cp1252`. Use
`git grep` rather than `grep -r` across a repo with `node_modules`; the latter can hang.

## Record the numbers

Write down task count, dex class count, the permission list, scan counts (OmniMorse: 103 problems
with no lists, all inside `node_modules`; 0 with the recipe's lists; 96 files deleted) and the APK
size. The merge request quotes them, and the next release compares against them.

## Done

Checks 1–9 have passed on a tree built outside the source repo, and the numbers are recorded.
