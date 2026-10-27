* [x] The app complies with the [inclusion criteria](https://f-droid.org/wiki/page/Inclusion_Policy)
* [x] The app is not already listed in the repo or issue tracker.
* [x] The original app author has been notified (and does not oppose the inclusion). I am the original app author.
* [ ] [Donated](https://f-droid.org/donate/) to support the maintenance of this app in F-Droid. Optional, not done yet.

Link to the source code: https://github.com/<owner>/<app>
Link to app in another app store: <a PUBLIC store link: App Store, or Play once it is out of closed testing>
License used: <SPDX licence id>
Category: <F-Droid category>
Summary: <the store short description, at most 80 characters>
Description: <one paragraph: what the app does, its main features, the interface languages.>

<Only when the F-Droid build differs from the store build: what it leaves out and why, in one paragraph. Example: The F-Droid build has no internet permission, no crash reporting and no update checks: Firebase Crashlytics and expo-updates are removed at build time, and Google's ML Kit and Play Install Referrer are patched out of expo-camera and expo-application. Speech input uses the platform SpeechRecognizer, which on most phones is Google's online service, so the recipe declares NonFreeNet; everything else works offline.>

The Android build is mirrored to a self-contained, Gradle-buildable repo kept in sync with releases: https://github.com/<owner>/<app>-android (every Expo native module is compiled from source; the build needs only Node from Debian + Gradle).
