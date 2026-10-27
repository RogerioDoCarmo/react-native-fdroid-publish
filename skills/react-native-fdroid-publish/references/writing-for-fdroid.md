# Writing for F-Droid

Conventions for every text posted on GitLab: the RFP, the merge request, comments, replies to
reviewers, commit messages on the fork. Reviewers there are volunteers with a long queue; texts
that are short, factual and easy to check get merged faster.

## Always

- **English**, whatever language the owner works in. Translate for the owner if they want to read
  it first, but post English.
- **Show the owner the exact text, then post it.** Nothing goes out under their name unseen.
- **F-Droid's LIVE templates, every line kept.** Fetch the RFP and merge request templates fresh
  with `glab-fdroid.mjs template rfp|mr` each time, and fill them in. Never reuse an old body,
  this skill's answer sheets included. Both templates changed between Miroji (July 2026) and
  OmniMorse (October 2026), and OmniMorse's merge request was closed with "Merge Request template
  is not followed". Tick a box only when it is true; leave it unticked with a short reason after it
  (`Not applicable, no external repo dependency.`). `open-rfp` and `open-mr` refuse a body that
  drops a heading, a field or a checkbox of the live template.
- **The app stands on its own: no other store, ever.** No F-Droid text names Apple, the App
  Store, iOS, iPhone, iPad, TestFlight, Google Play, the Play Store or the Play Console, and none
  links to them. That covers the RFP, the merge request, comments, replies, the recipe and the
  Fastlane listing. That the app is published elsewhere, or how its testers were found there,
  counts for nothing on F-Droid. On OmniMorse's RFP the reviewer deleted the App Store link line
  from the description before the merge request was closed. Library names a reviewer needs in
  order to verify a removal stay ("Google Play Services", "Play Install Referrer"). Every helper
  command that posts refuses a text that names a store.
- **Facts you checked, stated plainly.** "Built with every Expo `local-maven-repo` deleted; no
  firebase/gms/mlkit/installreferrer classes in the dex; `fdroid scanner` clean on the APK and on
  the source." Each claim traces to `local-verification.md`.
- **Describe what the build is.** What the F-Droid build removes, what it patches, which
  permissions it requests, and why any anti-feature applies. Reviewers look for exactly this.
- **Let the pipeline speak for itself.** Describe what was built and verified; leave out
  speculation about what F-Droid's server might do differently. When the pipeline finds something,
  fix it on the branch; the commit shows the fix.
- **Offer the reviewer an easy way out of a disagreement.** "If you consider it a non-free
  dependency instead, it is a single build switch to remove it, and that state is already tested."
- **"I am the original app author."** on the author-notified line.
- **Plain punctuation is safest.** Em dashes and accented names are fine when the request body is
  UTF-8 (the helper guarantees it), but check the posted text by bytes once; Miroji's RFP shows a
  `�` where an earlier tool mangled one.

## The RFP

The live template, filled in with the answers in [../templates/rfp.md](../templates/rfp.md).
Title: the app name alone. As of October 2026 it asks for the checklist, the application ID, a
metadata block (the recipe's fields, `Repo:` being the mirror), "Why do you want this app added
to F-Droid", a summary and a description.

- Summary: ≤ 80 characters, and never "Android", "FLOSS", "open source" or "free software"; the
  template says so.
- Description: no repository links ("Don't add more repo links here"). The mirror is in `Repo:`
  and in the `too-many-git-urls` comment.

## The merge request

The live template, filled in with the answers in
[../templates/merge-request.md](../templates/merge-request.md). Title `New app: <App name>`. As of
October 2026 it opens with an **Abstract**: what the app does, with screenshots, why it was
written, and what it does that similar F-Droid apps do not. Then about 30 checkboxes under
Policy, Docs, Merge Request Setup, Metadata and Pipeline, then `Closes rfp#<iid>` and
`/label ~"New App"`. Add **Notes for the reviewer** after the checklist: the variant, the
anti-feature, what was verified, in three bullets.

The pipeline boxes stay unticked when you open it: nothing has run on their side yet. Leaving
Reproducible Builds off needs a reason; "No, I don't want this." was not one.

## Replying to a reviewer

Seen on Miroji's !43165, and what worked:

```text
Thanks for the review! All three points addressed:

1. Name/summary/description removed from the metadata. They now live in fastlane structure in the build repo and are pulled from there.
2. commit: now pins the full commit hash.
3. Node.js is installed from Debian.
```

- One numbered item per point, in the reviewer's order, saying what changed. Push the fix first,
  then reply.
- One line when one line does: `Done, switched to JDK 21.` / `Done, subdir set to android/app.`
- A suggestion applied through GitLab's UI needs no reply; resolve the thread.
- "Is this useful?": say what the app does that the alternatives do not, and what it **cannot** do
  (one permission, no network, no storage). Numbers help ("useLegacyPackaging took the APK from
  39 MB to 20.5 MB on your CI build (job 15660278814)"). Ending with "I understand if it's still too
  narrow for inclusion." was fine; it was merged.
- "Why does it require X?": the plain reason, then what you changed ("INTERNET came from React
  Native's core manifest, for the Metro dev server, and was never used. I've stripped it: the
  release now requests CAMERA only.").

## The `too-many-git-urls` comment

When the bot labels the RFP `too-many-git-urls`, post
[../templates/comment-too-many-git-urls.md](../templates/comment-too-many-git-urls.md): which URL
is the source (`SourceCode:`), which is the generated mirror (`Repo:`), and why the split exists.
Nobody objected on Miroji. The label does not always appear (it did not on OmniMorse); the comment
then does no harm.

## Commit messages on the fork

`New app: <App>` for the first; `New app: <App>: <what changed>` for fixes during review
(`New app: OmniMorse: CMake and Ninja from Debian`); `Update <App> to <version>` for a new build
entry.

## Done

Every text is English, approved by the owner, built from the templates, and each claim in it has a
check behind it.
