# The recipe

One YAML file, `metadata/<applicationId>.yml`, in `fdroid/fdroiddata`. Start from
[../templates/recipe.yml](../templates/recipe.yml). F-Droid's own starting point is
`templates/build-react-native.yml` in fdroiddata; this template is that one with every reviewer
requirement from Miroji's and OmniMorse's merge requests already applied.

## Reviewer requirements (each one was asked for)

| Requirement | In the recipe |
| --- | --- |
| No `Name`, `Summary` or `Description` | they come from Fastlane in the mirror (`build-mirror.md`) |
| Full commit hash, never a tag or branch | `commit: <40 hex>` from the mirror run's summary |
| Node from Debian, no downloaded tarballs | `apt-get install -y nodejs npm` in `sudo` |
| JDK 21 | the `sed` lines in `prebuild` (below) |
| `subdir` set, no `output` | `subdir: android/app` |
| Valid categories | names from fdroiddata's `config/categories.yml` |
| A smaller APK | `expo.useLegacyPackaging=true` (Miroji: 39 MB → 20.5 MB) and only `armeabi-v7a,arm64-v8a` |

## The build block, line by line

```yaml
sudo:
  - apt-get update
  - apt-get install -y nodejs npm cmake ninja-build   # CMake 3.31.6 is what Debian trixie ships
  - npm install -g pnpm@<version from packageManager>
init:
  - cd ../..                                          # from subdir back to the repo root
  - pnpm install --frozen-lockfile --prod             # --prod: no Storybook, Stryker, etc.
  - patch -p1 -d node_modules/<module>/android < patches/<name>.patch
gradle:
  - yes
prebuild:
  - cd ../..
  - sed -i '/jvmToolchain\|JavaVersion/s/17/21/' node_modules/@react-native/gradle-plugin/*/build.gradle.kts
    node_modules/@react-native/gradle-plugin/react-native-gradle-plugin/src/main/kotlin/com/facebook/react/utils/JdkConfiguratorUtils.kt
  - sed -i '/jvmTarget\|JavaVersion/s/17/21/' <each module that hard-codes 17>
  - sed -i 's/^reactNativeArchitectures=.*/reactNativeArchitectures=armeabi-v7a,arm64-v8a/' android/gradle.properties
  - sed -i 's/^expo.useLegacyPackaging=.*/expo.useLegacyPackaging=true/' android/gradle.properties
scanignore:
  - <every build-time path the source scan flags and the build needs>
scandelete:
  - node_modules
ndk: <the NDK version in android/build.gradle, e.g. 27.1.12297006>
```

⚠️ **JDK 21 and modules that hard-code 17.** After the React Native Gradle plugin moves to 21, any
module that pins Java or Kotlin 17 itself disagrees with it. Find them:

```bash
grep -lE 'jvmTarget|JavaVersion|jvmToolchain' node_modules/*/android/build.gradle* node_modules/@*/*/android/build.gradle*
```

Seen so far: `@react-native-community/datetimepicker` and `react-native-worklets` (`build.gradle`
in older versions, `build.gradle.kts` in newer; the `sed` must name the file that exists).

⚠️ **CMake.** `expo-modules-core` builds native code with CMake, and Gradle asks for one exact
version. F-Droid's build image has none; Gradle accepts a CMake on `PATH` when the version matches.
Debian trixie packages `cmake` 3.31.6, which is what SDK 57 asks for. When an upgrade moves the
requested version, check what trixie (or trixie-backports) ships before anything else.

⚠️ **Package manager version.** Install the version `packageManager` names, or one the lockfile
format accepts (Miroji: `pnpm@10`; OmniMorse: `pnpm@10.4.1`).

⚠️ **Dev-only packages.** `expo-dev-client` was removed in Miroji's `init` with `pnpm remove
expo-dev-client`; `--prod` covers devDependencies.

## `scanignore` and `scandelete`

`scandelete: node_modules` lets the scanner delete every flagged file in dependencies. `scanignore`
protects the few the build needs. Each entry must match a real finding of the source scan; an unused
entry is an error. Entries seen (paths are relative to the repo root):

| Entry | Why | Seen in |
| --- | --- | --- |
| `node_modules/react-native/sdks/hermesc/linux64-bin` | Hermes compiler, RN ≤ 0.85 | Miroji |
| `node_modules/hermes-compiler/hermesc/linux64-bin` | Hermes compiler, RN ≥ 0.86 | OmniMorse |
| `node_modules/expo-modules-core/android/ExpoModulesCorePlugin.gradle` | `mavenLocal()` | both |
| `node_modules/expo-modules-autolinking/scripts/android/autolinking_implementation.gradle` | flagged in SDK 54, not in 57 | Miroji |
| `node_modules/react-native/ReactAndroid/publish.gradle` | local publishing repo | both |
| `node_modules/react-native-safe-area-context/android/build.gradle` | the `node_modules/react-native/android` repo | both |
| `node_modules/react-native-svg/android/build.gradle` | same | OmniMorse |
| `node_modules/@react-native-async-storage/async-storage/android/build.gradle` | resolved module path | OmniMorse |

## Top-level fields

```yaml
AntiFeatures:            # only if the audit found one
  NonFreeNet:
    en-US: <one or two sentences: what reaches which service, and that the rest works without it>
Categories: [<from config/categories.yml>]
License: <SPDX id>
AuthorName: <owner>
AuthorEmail: <public contact address>      # optional
SourceCode: https://github.com/<owner>/<app>
IssueTracker: https://github.com/<owner>/<app>/issues
Changelog: https://github.com/<owner>/<app>/releases
AutoName: <App name>
RepoType: git
Repo: https://github.com/<owner>/<app>-android.git
AutoUpdateMode: Version
UpdateCheckMode: Tags
CurrentVersion: <versionName>
CurrentVersionCode: <versionCode>
```

`AutoUpdateMode: Version` with `UpdateCheckMode: Tags` lets F-Droid's `checkupdates` add new
builds when the mirror gets a new tag. Each new build entry copies the previous one with the new
version and commit.

## New version during review

Add a second build entry (copy the first, new `versionName`, `versionCode`, `commit`), update
`CurrentVersion`/`CurrentVersionCode`, push to the same branch. The reviewer asked for exactly
this on Miroji ("if you release a new version please update this MR").

## Done

Every field filled from the project sheet and the mirror run, no summary or description present,
categories valid, and every `scanignore` entry matched by the source scan.
