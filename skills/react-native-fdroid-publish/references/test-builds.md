# A test build on a real phone

Before submitting, put the F-Droid build on a physical device. Build it from the scanned tree
(`local-verification.md`), with two edits so it installs **beside** the store build:

| Edit | Where | Example |
| --- | --- | --- |
| Application ID suffix | `android/app/build.gradle` → `applicationId` | `com.example.app.fdroidtest` |
| Launcher label | `android/app/src/main/res/values/strings.xml` → `app_name` | `MyApp F-Droid` |

Then `./gradlew assembleRelease`. The release build is signed with the debug key unless a release
key is configured, which is what you want for a test APK.

Name the file meaningfully, `<app>-<version>-<versionCode>-fdroid-test.apk`, not
`app-release.apk`.

## Why a separate ID

⚠️ **The owner keeps the store build installed.** Same application ID with a different signing
key means Android refuses the install until the store build is removed. During a Play closed test
that device is a counted tester; uninstalling it can break the 12-testers-for-14-days requirement.
The test ID removes the question.

The same applies to the APK F-Droid's CI signs in the merge request pipeline (the "Signed APK" Code
Quality link): it carries the **real** application ID with a throwaway key. Do not install it on a
phone that has the store build.

## Delivery

- Send the APK to the owner directly, or
- **Firebase App Distribution** (if the project already uses it): the APK's package must match the
  Firebase app's package exactly, or the upload is rejected. Register a separate Firebase Android
  app for the test ID (`firebase apps:create ANDROID "<App> F-Droid test" --package-name
  <id>.fdroidtest`), with the owner's go-ahead, and distribute to the owner's own tester group.
  Firebase is only the delivery channel here; nothing of it is in the APK.

## Done

The owner reports the test build working on a physical phone: each kept feature exercised, each
removed one absent.
