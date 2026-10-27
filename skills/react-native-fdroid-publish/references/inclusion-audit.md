# Inclusion audit

What F-Droid's [inclusion policy](https://f-droid.org/docs/Inclusion_Policy/) rejects, and how to
find each thing in a React Native project. The policy forbids proprietary code in the APK, names
Firebase and Crashlytics outright, forbids an app downloading code outside F-Droid's review, and
asks for a build flavour without such dependencies when upstream has them.

## First: is the app old enough?

Quality point 6 of the policy: the app "should have been actively developed for at least 3 months",
unless it "has been proven to have some users", **the author has been maintaining other apps on
F-Droid**, or it is "developed only for an event". The merge request template tells reviewers to
"pay special attention" to it, and they do. OmniMorse's merge request was closed at 67 days, with
its pipeline green.

- Count from the first commit (project sheet). Under 3 months with no exception: do the
  technical work now, and open the merge request only after the date.
- An exception that applies goes **in the merge request**, beside that checkbox, with a link
  (the author's other app's F-Droid page). OmniMorse qualified through Miroji but never said so.
- Never argue the "some users" exception from another store's numbers: F-Droid texts name no
  other store (`writing-for-fdroid.md`), and the app is judged on its own there.

**Done when** the date the app turns 3 months old is on the project sheet, and either it has
passed or an exception with its proof is written down.

## The four classes

Give every native dependency and every network use one of these:

| Class | Meaning | Example |
| --- | --- | --- |
| **keep** | FOSS all the way down | `expo-audio` → AndroidX Media3 (Apache-2.0) |
| **patch** | FOSS module that links a Google library you do not use | `expo-camera` → ML Kit; `expo-application` → Play Install Referrer |
| **remove** | proprietary or code-downloading, and the app can live without it | Firebase Crashlytics, `expo-updates`, analytics, ads |
| **keep + anti-feature** | FOSS code that reaches a non-free network service the user may choose | platform `SpeechRecognizer` → `NonFreeNet` |

## What to look for

| Look for | Where it hides | Class |
| --- | --- | --- |
| `@react-native-firebase/*`, `com.google.firebase`, `google-services` | `package.json`, config plugins, `google-services.json` | remove |
| `com.google.android.gms` (Play Services) | transitive, through Expo modules | patch or remove |
| `com.google.mlkit`, `play-services-code-scanner`, `camera-mlkit-vision` | `expo-camera/android/build.gradle` | patch |
| `com.android.installreferrer` | `expo-application/android/build.gradle` | patch |
| `expo-updates` | `package.json`, `app.json` → `updates`, `runtimeVersion` | remove: it downloads JavaScript F-Droid never reviewed |
| `expo-dev-client` | `package.json` | remove from the mirror (`pnpm remove expo-dev-client` in the recipe) |
| Analytics, ads, remote config | `package.json` | remove |
| Prebuilt AARs | every Expo module's `local-maven-repo/` | made irrelevant by `buildFromSource: [".*"]` |
| `INTERNET`, `ACCESS_NETWORK_STATE` | React Native's core manifest adds `INTERNET` for the Metro dev server | strip in the release manifest when nothing needs it |

⚠️ **Search the dependency tree, not just `package.json`.** Run `grep -rE
'firebase|gms|mlkit|installreferrer' node_modules/*/android/build.gradle
node_modules/@*/*/android/build.gradle` and read every hit. Miroji's only problem, ML Kit, came in
through `expo-camera`, which the app used only for the front-camera preview.

⚠️ **A compile-only switch is not removal.** Expo SDK 57 added
`expo.camera.barcode-scanner-enabled=false`, which only demotes ML Kit to `compileOnly`: it is
still fetched, still compiled against, and still flagged by the scanner.

## `INTERNET`

Ask "does the F-Droid build need the network at all?" before anything else.

- Miroji declared `INTERNET` only because React Native's core manifest does, for debug builds to
  reach Metro. A reviewer asked "why does it require INTERNET?". Stripping it left `CAMERA` alone.
- OmniMorse's store build needs it for Crashlytics and updates, so it is stripped in the F-Droid
  variant only.

Strip it with a release manifest overlay (`tools:node="remove"`), and verify with `aapt2 dump
permissions` on the release APK, not by reading the manifest: the main manifest still lists it.

## Anti-features

Declare one when FOSS code reaches a non-free service the user can avoid; it is a label, not a
rejection. `NonFreeNet` is the usual one for React Native: speech recognition through the platform
`SpeechRecognizer`, which on most phones is Google's online service. Precedent in fdroiddata:
`com.omiyawaki.osrswiki` ("SpeechRecognizer is optional platform API; not a proprietary
dependency"). `NonFreeDep` is wrong when the feature does not _require_ non-free software and the
app is fully usable without it.

Keep such a feature behind its own switch, so a reviewer who disagrees costs a one-word edit.

## Usefulness

Reviewers ask whether anyone will use the app. Miroji (a front-camera mirror) was asked "Isn't this
a function supported by the stock camera?". Have the answer ready: what the app does that the
alternatives do not, and what it _cannot_ do (permissions, no network, no storage). It was merged
after that answer.

Quality point 5 asks for "some unique value", and the merge request template's Abstract asks for
it outright ("the unique functions it provides over other similar apps in F-Droid"). Search
`https://search.f-droid.org/?q=<subject>` before writing it, and name the closest apps.

## Done

The age gate has an answer (the date, or an exception with proof). Each dependency on the project
sheet has a class and a one-line reason. The network question has an answer. The owner has
approved what the F-Droid build loses.
