# After it is published

## Within a day or two of the merge

- The app appears at `https://f-droid.org/packages/<applicationId>/` after F-Droid's next index
  update. Check it loads before announcing anything.
- **Privacy policy**: add a short F-Droid section to the published policy and to `PRIVACY.md` in
  the same commit: that build has no crash reporting, no update checks, no internet permission (if
  stripped), and where any anti-feature's data goes (speech to the device's recogniser). Keep the
  store sections as they are; the store build still does what they say.
- **Badges**: the F-Droid badge in the mirror's README and the project's README, linking to the
  package page. Official badge: `https://f-droid.org/badge/get-it-on.png`.
- Tell users the two installs are separate: F-Droid's APK is signed with F-Droid's key, so it
  cannot update over a Play install and vice versa.

## Every release after that

1. Release a plain `vX.Y.Z` as usual. The mirror workflow pushes a new snapshot and tag.
2. F-Droid's `checkupdates` sees the tag (`AutoUpdateMode: Version`, `UpdateCheckMode: Tags`) and
   adds a build entry by copying the last one with the new version and commit.
3. It builds, signs and publishes; typically within a few days.

⚠️ When an upgrade changes what the build needs (a patch no longer applies, a new `scanignore`
path, a new CMake version), the automatic build fails silently on F-Droid's side. Watch the app's
build log at `https://monitor.f-droid.org/builds/log/<applicationId>/<versionCode>` after each
release, and send an fdroiddata merge request updating the recipe when it fails. Run
`local-verification.md` on the release before tagging when the Expo SDK or React Native moved.

## Done

The package page is live, the policy and badges are in place, and the next plain release reached
F-Droid without manual steps.
