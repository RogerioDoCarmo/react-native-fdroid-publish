# Review, statuses and findings

What the owner will see on GitLab between "merge request open" and "app published", what each
thing means, and what (if anything) is theirs to do. Explain these when asked; the owner should
never have to guess whether a status means "act now".

## RFP statuses and labels

| What they see | Meaning | Action |
| --- | --- | --- |
| Status **To do** right after creating it | GitLab's default for a new issue | none. It stays **To do** through the whole review |
| Status **Done**, issue closed | a maintainer closed it when the merge request merged (Miroji: set to Done the same day `!43165` merged) | none |
| Labels added by **fdroid-bot** (`git-url`, `gradle`, `kotlin`, `react`, `license`, `github-actions`, a local module's name...) | the bot's automatic scan of the source repo | none |
| Label **too-many-git-urls** | the body links two git repos (source and mirror) | post the explanation comment (`writing-for-fdroid.md`) |

## Merge request statuses and labels

| What they see | Meaning | Action |
| --- | --- | --- |
| Pipeline green, no comments | waiting in the review queue | none; days to weeks |
| Reviewer comments | change requests, usually small | fix on the branch, reply (`writing-for-fdroid.md`) |
| Label **review-requested**, "This MR is mostly ready. We'll test it later..." | accepted in principle; queued for a maintainer to test the build | none. Miroji waited about two weeks from this to merge |
| "If you release a new version please update this MR" | a new upstream release must be added as a build entry | add the build entry on the same branch (`recipe.md`) |
| A question about usefulness, size or a permission | the reviewer is deciding whether to include it | answer plainly; it is not a rejection |
| Merged | the recipe is in fdroiddata | wait for the next F-Droid index update (a day or two) for the app to appear |
| Detailed merge status `mergeable` / `unchecked` | GitLab's own merge check | none; maintainers merge |

## Code Quality findings

F-Droid's `check apk` job lists what is inside the signed test APK so a reviewer can see it at a
glance. They are a report, not errors. Typical findings and what to tell the owner:

| Finding | Meaning |
| --- | --- |
| Minor: Permission `android.permission.CAMERA`, `RECORD_AUDIO` (any dangerous permission) | flagged because it is sensitive; expected when the feature needs it |
| Minor: APK has no R8 marker, R8 is not used | the release build is not minified (Expo's default). Optional to enable later; in React Native it needs keep-rules and a device test |
| Info: Permission `MODIFY_AUDIO_SETTINGS`, `VIBRATE`, `WAKE_LOCK` | normal permissions |
| Info: Permission `<appId>.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` | AndroidX adds it to every app targeting Android 13+ |
| Info: Signing Key `CN=y, OU=y, ...` | the CI's throwaway test key. F-Droid signs releases with its own key |
| Info: APK ABI and size | per-ABI and total size (OmniMorse: 20 MB per ABI, 27 MB total) |
| Info: Fastlane/Triple-T in `<locale>` | the listing F-Droid found: name, summary, description, what's new, graphics, screenshots |
| Info: Signed APK link | the CI-signed APK. Same application ID as the store build with a different key: do not install it over the store build |

The finding that matters is what is **absent**: no `INTERNET` when the build should have none.

## What is pending, at each point

| Moment | Pending on the owner's side |
| --- | --- |
| RFP open, MR not yet | nothing until the MR is opened |
| MR open, pipeline running | nothing; failures get fixed on the branch |
| MR green, no comments | nothing; answer comments when they arrive |
| New upstream release before merge | a new build entry in the same MR |
| Merged | add the F-Droid badge and privacy-policy section (`after-publishing.md`) |

## Done

The owner knows, for each status they see, whether anything is theirs to do.
