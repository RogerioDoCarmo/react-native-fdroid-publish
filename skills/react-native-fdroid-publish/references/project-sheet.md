# Project sheet

Fill this in before changing anything. Every later step reads from it, and a wrong value here
(an application ID, a licence) becomes a wrong recipe. Read each value from the project; mark
anything you could not find as **unknown** and ask the owner.

| Field | Where to read it | Example |
| --- | --- | --- |
| App name | `app.json` → `expo.name`, or `android/app/src/main/res/values/strings.xml` | OmniMorse |
| Application ID | `app.json` → `expo.android.package`, or `applicationId` in `android/app/build.gradle` | `com.example.app` |
| Shape | is `android/` committed? No → **Expo managed** (needs a mirror). Yes → **bare** (F-Droid may build the source repo directly) | Expo managed |
| Expo SDK / React Native | `package.json` | `~57.0.15` / `0.86.2` |
| Package manager | `packageManager` in `package.json`, or the lockfile present | `pnpm@10.4.1` |
| Node version | `.nvmrc`, `engines.node` | 24 locally; Debian trixie ships 20.19 |
| Version | `app.json` → `expo.version` and the latest release tag | `0.3.7`, tag `v0.3.7` |
| Tag scheme | `git tag` | `vX.Y.Z`, plus `vX.Y.Z+metadata` for same-version re-releases |
| Licence | `LICENSE`, `package.json` → `license` | MIT |
| Source repo | `git remote -v` | `https://github.com/owner/app` |
| Issue tracker / changelog | GitHub issues and releases URLs | |
| Author name / contact email | the owner. Use the public contact address, not a personal one | |
| First commit | `git log --reverse --format=%ad --date=short \| head -1` | 2026-08-21: three months fall on 2026-11-21 |
| Owner's apps already on F-Droid | `https://f-droid.org/api/v1/packages/<their other app ids>` | Miroji, `com.rogeriodocarmo.miroji`, 3 versions |
| Similar apps on F-Droid | `https://search.f-droid.org/?q=<subject>` | Morse, SOS Flashlight, MorseLightCrypt, Morse Trainer |
| Locales | store listing files, `i18n` folder | en-US, pt-BR, es |
| Native dependencies | `pnpm exec expo config --type introspect`, or every `expo-*`, `react-native-*`, `@react-native-*` in `package.json` with an `android/` folder, plus local modules | |
| Network uses | crash reporting, analytics, OTA updates, remote config, speech recognition, ads | Crashlytics, expo-updates |
| Store-build secrets | `google-services.json` and similar | present, gitignored |

⚠️ **Local Expo modules** (`modules/<name>/android`) are native code too. List them; they must be
copied into the mirror and compile from source.

⚠️ **Shape decides the route.** A bare project with `android/` committed can often skip the
mirror: the recipe points `Repo:` at the source repo with `subdir: android/app`. Everything else in
this skill still applies. Both apps proven so far were Expo managed.
