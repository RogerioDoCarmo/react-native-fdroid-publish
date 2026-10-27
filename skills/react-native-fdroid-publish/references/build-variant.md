# The F-Droid build variant

Needed only when the audit classed something **remove**. If nothing is removed (Miroji), skip this
file: the store build is the F-Droid build, with patches.

Two builds, chosen at build time:

- **`store`**: Play and the App Store. The default whenever nothing says otherwise, and exactly the
  app as it was before variants existed.
- **`fdroid`**: what F-Droid compiles.

## Naming the variant

Read it from **both** an environment variable (`<APP>_BUILD_VARIANT=fdroid`) and a field in
`package.json` (`"<app>": { "buildVariant": "fdroid" }`).

⚠️ **The mirror must carry the choice in a file.** F-Droid's Gradle run re-evaluates
`app.config.js` and `metro.config.js` during bundling, with none of your environment. The mirror
workflow writes the `package.json` field; the environment variable serves local runs.

⚠️ **Fail loudly.** An unknown variant name, or the variable and the field disagreeing, throws.
A typo must not silently build the store app, Firebase and all; the first sign would otherwise be
the scanner's rejection.

## One table, every reader

One module (`build-variant.js`, plain CommonJS so configs can `require` it) holds:

```js
const DISABLED_FEATURES = { store: [], fdroid: ['crashReporting', 'otaUpdates'] };
const NATIVE_PACKAGES = {
  crashReporting: ['@react-native-firebase/app', '@react-native-firebase/crashlytics'],
  otaUpdates: ['expo-updates'],
};
const PERMISSIONS = {
  // A permission is dropped only when EVERY feature listing it is off.
  crashReporting: ['android.permission.INTERNET', 'android.permission.ACCESS_NETWORK_STATE'],
  otaUpdates: ['android.permission.INTERNET', 'android.permission.ACCESS_NETWORK_STATE'],
};
```

The app keeps the same table in its domain layer (TypeScript), and a test fails when the two
disagree.

| Reader | What it does with a disabled feature |
| --- | --- |
| Mirror workflow | `pnpm remove`s its packages, so neither `package.json` nor the lockfile names them |
| `app.config.js` | drops its config plugins and permissions, ignores credential files on disk (`google-services.json`) |
| `metro.config.js` | resolves its packages to an **empty module**, and prefers `*.fdroid.ts` twins over their store files |
| Adapter wiring (ports) | never constructs its adapter; supplies a no-op or a never-available one |
| Screens | remove its tab, rows, buttons and footnotes: gone, not greyed |

⚠️ **Empty, not missing.** The packages are uninstalled in the mirror, so any surviving `import`
would fail the bundle. Metro resolving them to an empty module keeps the bundle building; the
`*.fdroid.ts` twin keeps the adapter's own code (which names the library) out of the bundle.

⚠️ **The store variant gets Metro's config back untouched**, the very same object, so the store
bundle is what Expo would have built with no `metro.config.js`. Pin that in a test.

⚠️ Strings survive too. OmniMorse's first F-Droid bundle still contained the Firebase adapter's code
and the `expo-updates` URL from `app.json` (read whole to show the version). Fixes: a `.fdroid.ts`
twin of the adapter, and the mirror's `app.json` loses `updates` and `runtimeVersion`. Grep the
bundle (`local-verification.md`).

## Kill switches are a different thing

Runtime feature flags (to turn off a defect found on a tester's phone) are meant to be turned back
on. Build features are permanent and per build. Keep them in separate modules.

## Tests

- The two tables agree.
- Every variant resolves; unknown names and disagreements throw.
- The store config is byte-identical to before: resolved Expo config and release manifest, with and
  without credential files present.
- The F-Droid config has none of the excluded plugins or permissions.
- Each screen renders without the removed feature's controls.
- If the project runs mutation testing, run it on the domain table; aim for no survivors.

## Done

The store build's resolved config and manifest are unchanged, and an F-Droid prebuild contains none
of the excluded packages, plugins or permissions.
