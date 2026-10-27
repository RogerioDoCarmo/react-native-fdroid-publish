Note on the "too-many-git-urls" label: this is intentional, not an error.

- https://github.com/<owner>/<app> is the actual FOSS app source (the metadata's SourceCode: field).
- https://github.com/<owner>/<app>-android is a generated, self-contained Gradle-buildable mirror, kept in sync automatically on every release via CI (the metadata's Repo: field, what F-Droid actually builds from).

This split exists because the app is Expo/React Native: the mirror lets F-Droid build with plain Gradle and Node from Debian, while development happens in <app>.
