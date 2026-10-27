# Native patches

For FOSS modules that link a Google library the app does not use. The patch is applied by the
**recipe's `init` step**, after the dependency install, so the store build never sees it and
`package.json` and the lockfile stay untouched.

```yaml
init:
  - cd ../..
  - pnpm install --frozen-lockfile --prod
  - patch -p1 -d node_modules/expo-camera/android < patches/expo-camera-remove-google-mlkit.patch
```

The patch files live in the source repo (`patches/`) and are copied into the mirror.

## Known patches

| Module | Removes | Proven on | Example |
| --- | --- | --- | --- |
| `expo-camera` | `play-services-code-scanner`, `mlkit:barcode-scanning`, `camera-mlkit-vision`, the ML Kit manifest hint, the two ML Kit-only files; stubs `BarcodeAnalyzer`, inlines `Barcode.FORMAT_*`, turns the scanner functions into rejections | expo-camera 17.0 (SDK 54) and 57.0 (SDK 57) | [../examples/patches/expo-camera-remove-google-mlkit.patch](../examples/patches/expo-camera-remove-google-mlkit.patch) (57.0.4) |
| `expo-application` | `com.android.installreferrer:installreferrer`; `getInstallReferrerAsync` rejects | expo-application 57.0 (SDK 57) | [../examples/patches/expo-application-remove-installreferrer.patch](../examples/patches/expo-application-remove-installreferrer.patch) |

Alternatives without a patch file, from F-Droid's own `templates/build-react-native.yml`: `sed`
lines in `prebuild`, for example `sed -i -e '/installreferrer/d'
node_modules/expo-application/android/build.gradle`. A patch file is easier to review and fails
loudly; a `sed` that matches nothing fails silently.

⚠️ **Patches are pinned to the exact `node_modules`.** Miroji's expo-camera patch no longer applied
on SDK 57 (4 of 6 hunks failed). After any Expo upgrade, regenerate:

```bash
mkdir -p /tmp/p && cp -r node_modules/expo-camera/android /tmp/p/a && cp -r node_modules/expo-camera/android /tmp/p/b
# edit /tmp/p/b, then, from inside /tmp/p so the paths read a/... and b/...:
(cd /tmp/p && diff -ruN a b) > patches/expo-camera-remove-google-mlkit.patch
patch -p1 --dry-run -d node_modules/expo-camera/android < patches/expo-camera-remove-google-mlkit.patch
```

⚠️ The app must not use what the patch removes (barcode scanning, install referrer). Grep the app
source for the API before patching.

## Prebuilt AARs: build from source instead

Expo ships each native module with a `local-maven-repo/` holding an already-compiled AAR and uses
it by default. F-Droid requires everything compiled from source. Expo's own option forces that, in
the mirror's `package.json`:

```json
"expo": { "autolinking": { "android": { "buildFromSource": [".*"] } } }
```

The recipe's `scandelete: node_modules` then lets the scanner delete the unused AARs. Prove it
locally by deleting every `local-maven-repo` and building (`local-verification.md`): the build can
then only pass by compiling from source. expo-camera's prebuilt AAR was compiled _with_ ML Kit,
which is exactly why it must go unused.

## `hermesc`: the one prebuilt that stays

Hermes compiles the JS bundle at build time with a prebuilt `hermesc` shipped per OS. F-Droid builds
on Linux; `scanignore` keeps the Linux binary (a build tool that never ships in the APK) and
`scandelete` removes the rest. Its path moved in React Native 0.86:

| React Native | `scanignore` path |
| --- | --- |
| ≤ 0.85 | `node_modules/react-native/sdks/hermesc/linux64-bin` |
| ≥ 0.86 | `node_modules/hermes-compiler/hermesc/linux64-bin` |

## Done

Each patch applies cleanly to the lockfile's `node_modules`, and the app no longer calls anything
it removed.
