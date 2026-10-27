<!--
Answers for F-Droid's merge request template. This file is NOT the template:
OmniMorse's first merge request reused an older one and was closed with
"Merge Request template is not followed". Fetch the live one and fill it in:

  node scripts/glab-fdroid.mjs template mr merge-request.md

Keep every heading and every checkbox line, word for word. Put each answer
below under its matching heading. A heading with no answer here: answer it
from the project sheet. Then `check mr merge-request.md` before posting.
-->

## Abstract

Introduce the app and attach screenshots:
<Three to five sentences: what it does and how it is used. Then the phone screenshots, as images
linked from the Fastlane tree in the SOURCE repository:
![1](https://raw.githubusercontent.com/<owner>/<app>/<tag>/fastlane/metadata/android/en-US/images/phoneScreenshots/1.png)>

Why you wrote it, and what it does that similar apps in F-Droid do not:
<Search https://search.f-droid.org/ for the app's subject first and name the closest apps. Then
one short paragraph on what this one does that they do not, and what it cannot do (permissions,
no network, no storage). Facts only. Inclusion Policy quality point 5 asks for "some unique
value", and a reviewer reads this paragraph for it.>

## Checklist

Tick a box only when it is true. When one is not, leave it unticked and add the reason after it,
on the same line. Answers that need saying:

- Inclusion policy, quality point 6 (at least 3 months of active development): tick only if the
  first commit is more than 3 months old. Otherwise name the exception that applies, after the
  box: "The author maintains <other app> on F-Droid: https://f-droid.org/packages/<id>/".
  If no exception applies, do not open the merge request yet (`inclusion-audit.md`).
- Author notified: "I am the original app author."
- Fastlane: "In the source repository (`fastlane/metadata/android/`, <locales>), generated from
  the same listing files as the build repository's."
- Reproducible builds, when not enabled: one plain reason. Example: "Not enabled: the APK is
  built from a generated Expo project; F-Droid's signature is fine for this app."
- ABI split: the APK size per ABI and total, from the pipeline's `check apk` job, and whether a
  split is set.

## Notes for the reviewer

Added after the checklist, before the `---` line. Three bullets at most:

- What the F-Droid build is: a separate variant, prebuilt with `<APP>_BUILD_VARIANT=fdroid`. It
  removes <X> and <Y> (code, native modules and manifest entries), patches <Z> out of <module>,
  and drops `INTERNET`. The mirror workflow refuses to push a project that still references any
  of them.
- Each anti-feature, why, and the easy way out. Example: "NonFreeNet: speech input calls the
  platform `SpeechRecognizer`, which on most phones is an online service. The app works fully
  without it. If you consider it a non-free dependency instead, it is a single build switch to
  remove it, and that state is already tested."
- What was verified. Example: "Built with every Expo `local-maven-repo` deleted, no
  firebase/gms/mlkit/installreferrer classes in the dex, `fdroid scanner` clean on the APK and
  on the source with the recipe's scan lists."

## The end

`Closes rfp#<number>` and the template's `/label ~"New App"` line, both kept as they are.
