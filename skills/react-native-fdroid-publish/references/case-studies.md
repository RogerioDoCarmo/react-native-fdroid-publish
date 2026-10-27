# Case studies

The two apps every rule in this skill comes from. Both are Expo managed, pnpm, MIT, by the same
author; both use a build mirror.

| | Miroji | OmniMorse |
| --- | --- | --- |
| What it is | front-camera mirror | Morse translator: sound, torch, screen, vibration; tap decoder; speech input; 3 languages |
| Expo SDK / React Native | 54 / 0.81 | 57 / 0.86 |
| Source / mirror | [mirror_app](https://github.com/RogerioDoCarmo/mirror_app) / [mirror_app-android](https://github.com/RogerioDoCarmo/mirror_app-android) | [morse_app](https://github.com/RogerioDoCarmo/morse_app) / [morse_app-android](https://github.com/RogerioDoCarmo/morse_app-android) |
| RFP / merge request | [rfp#4133](https://gitlab.com/fdroid/rfp/-/issues/4133) / [!43165](https://gitlab.com/fdroid/fdroiddata/-/merge_requests/43165) (merged 2 Aug 2026) | [rfp#4676](https://gitlab.com/fdroid/rfp/-/issues/4676) / [!54504](https://gitlab.com/fdroid/fdroiddata/-/merge_requests/54504) |
| What F-Droid would reject | ML Kit inside `expo-camera`; an unused `INTERNET` | Firebase Crashlytics, `expo-updates`, ML Kit, Play Install Referrer |
| Build variant | none needed | `store` / `fdroid`, one table |
| Patches | expo-camera (ML Kit) | expo-camera (rebuilt for SDK 57), expo-application (Install Referrer) |
| Anti-features | none | `NonFreeNet` (platform speech recogniser) |
| Mirror packaging | patches from `main`, Fastlane hand-written | everything from the tag, Fastlane generated, a guard step refusing proprietary references |
| Pipeline failures | "user not verified"; JDK 21 (`jvmTarget` seds); `subdir`/`output` | CMake 3.31.6 missing (fixed with Debian's `cmake ninja-build`) |
| Reviewer questions | summary/description in recipe; tag instead of hash; Node from Debian; JDK 21; `subdir`; category; size; usefulness; INTERNET | none at the time of writing |

## Miroji's review, in order (!43165)

1. CI failed: "user not verified". The author verified by SMS.
2. "Don't add summary and description here. Add them in fastlane structure in your repo." / "Please
   don't use tag or branch in commit. Use the full commit hash instead." / "Install nodejs from
   debian."
3. "Please use jdk 21. See templates/build-react-native.yml"
4. "Please set the subdir and remove the output."
5. A category suggestion (`Camera`), applied in the UI.
6. "This MR is mostly ready. We'll test it later." (label `review-requested`)
7. "Does this 69M app only show the front camera? Isn't this a function supported by the stock
   camera? And why does it require INTERNET?" Answered: INTERNET stripped, x86 ABIs dropped,
   69 MB → 36.9 MB; then `useLegacyPackaging` → 20.5 MB.
8. "I don't think anyone will use this." Answered with what it cannot do and the work done for
   F-Droid; merged two weeks after step 6.

Every one of these is pre-empted in this skill's recipe template and texts.

## OmniMorse's route, in order

1. Audit; decision "acceptance over parity"; variant built; patches regenerated for SDK 57.
2. Local verification on Windows (Zulu 17): build with AARs deleted, dex, permissions, scanner on
   APK and source.
3. Side-by-side test APK (`.fdroidtest`) through Firebase App Distribution; works on the phone.
4. Mirror repo created, token set, workflow promoted to `main`, `v0.3.7+fdroid` tagged and
   dispatched; clone check.
5. glab installed, web login; the agent's sandbox could not see the login, so every GitLab call ran
   in the owner's terminal.
6. New dedicated fork; Miroji's RFP and MR re-read before posting; one gap found (worklets JDK 21
   `sed`) and closed.
7. RFP, comment, MR. First `fdroid build` failed on CMake; fixed in one push; all 10 jobs green.
