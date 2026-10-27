#!/usr/bin/env bash
# Copies a prepared source tree into a build-only snapshot for F-Droid.
#
#   tools/assemble-mirror.sh <source-dir> <mirror-dir> <versionCode> <versionName>
#
# <source-dir> has already been through the workflow's steps: excluded packages
# removed, package.json and app.json marked, `expo prebuild` run.
# Also runnable by hand to reproduce a mirror locally.
#
# node_modules is deliberately NOT copied: F-Droid installs it at build time
# from the mirrored lockfile.
set -euo pipefail

source_dir="$1"
mirror_dir="$2"
version_code="$3"
version_name="$4"

mkdir -p "$mirror_dir"

# Everything Gradle's bundling step reads. Add local modules, config files and
# anything app.config.js or metro.config.js requires.
items=(
  android
  src
  modules
  plugins
  patches
  assets
  App.tsx
  index.ts
  index.js
  app.json
  app.config.js
  metro.config.js
  babel.config.js
  build-variant.js
  package.json
  pnpm-lock.yaml
  tsconfig.json
  LICENSE
  PRIVACY.md
)
for item in "${items[@]}"; do
  if [ -e "$source_dir/$item" ]; then
    cp -R "$source_dir/$item" "$mirror_dir/$item"
  fi
done

# Build-only: tests, stories and local Gradle state have no place in a tree
# F-Droid's scanner reads.
if [ -d "$mirror_dir/src" ]; then
  find "$mirror_dir/src" \( -name '*.test.ts' -o -name '*.test.tsx' -o -name '*.stories.tsx' \) -delete
fi
rm -rf "$mirror_dir"/modules/*/android/build "$mirror_dir"/modules/*/android/.gradle
rm -rf "$mirror_dir/android/.gradle" "$mirror_dir/android/app/build" "$mirror_dir/android/build"
# Android Studio writes a toolchain pin here that breaks other machines.
rm -f "$mirror_dir/android/gradle/gradle-daemon-jvm.properties"

# prebuild outside EAS writes a placeholder versionCode; F-Droid needs the real one.
sed -i "s/versionCode [0-9][0-9]*/versionCode $version_code/" "$mirror_dir/android/app/build.gradle"
sed -i "s/versionName \"[^\"]*\"/versionName \"$version_name\"/" "$mirror_dir/android/app/build.gradle"
grep -q "versionCode $version_code$" "$mirror_dir/android/app/build.gradle"

# F-Droid's scanner resolves real paths; pnpm's default layout symlinks every
# package through node_modules/.pnpm/<name@version_hash>/, which no recipe can
# name stably. Hoisted gives a flat node_modules with plain paths.
echo "node-linker=hoisted" > "$mirror_dir/.npmrc"

# Fastlane: copy a prepared tree, or generate it here from the store listing
# files (title <= 50, short <= 80, full <= 4000, changelog <= 500 characters).
if [ -d "$source_dir/fastlane" ]; then
  cp -R "$source_dir/fastlane" "$mirror_dir/fastlane"
fi
