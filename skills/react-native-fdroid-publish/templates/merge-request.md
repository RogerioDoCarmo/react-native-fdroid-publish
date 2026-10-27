### Required

- [x] The app complies with the [inclusion criteria](https://f-droid.org/docs/Inclusion_Policy)
- [x] The original app author has been notified (and does not oppose the inclusion) I am the original app author.
- [x] All related fdroiddata and RFP issues have been referenced in this merge request
- [ ] Builds with `fdroid build` and all pipelines pass
- [x] There is an issue tracker and contact info of the author so that we can report bugs and contact the author.

### Strongly Recommended

- [x] The upstream app source code repo contains the app metadata in a Fastlane or Triple-T folder structure: `fastlane/metadata/android/` (<locales>) in the build mirror, regenerated on every release.
- [x] Releases are tagged and auto update is enabled: tags follow `vX.Y.Z`; `AutoUpdateMode: Version` / `UpdateCheckMode: Tags` are set.

### Suggested

- [ ] External repos are added as git submodules instead of srclibs: Not applicable, no external repo dependency.
- [ ] Enable Reproducible Builds: No, I don't want this.
- [ ] Multiple apks for native code: Not applicable, single APK (armeabi-v7a + arm64-v8a).

### Notes for the reviewer

- <What the F-Droid build is: e.g. a separate variant, prebuilt with `<APP>_BUILD_VARIANT=fdroid`. It removes <X> and <Y> (code, native modules and manifest entries), patches <Z> out of <module>, and drops `INTERNET`. The mirror workflow refuses to push a project that still references any of them.>
- <Each anti-feature, why, and the easy way out: e.g. NonFreeNet: speech input calls the platform `SpeechRecognizer`. On most phones that is Google's online recogniser. The app works fully without it. If you consider it a non-free dependency instead, it is a single build switch to remove it, and that state is already tested.>
- <What was verified: e.g. Verified locally: built with every Expo `local-maven-repo` deleted, no firebase/gms/mlkit/installreferrer classes in the dex, `fdroid scanner` clean on the APK and on the source with the recipe's scan lists.>

Closes rfp#<RFP number>
