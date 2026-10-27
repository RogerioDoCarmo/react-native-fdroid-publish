<!--
Answers for F-Droid's RFP template. This file is NOT the template: F-Droid
changes theirs, and a stale copy is how an RFP goes out with lines the
maintainers no longer ask for. Fetch the live one and fill it in:

  node scripts/glab-fdroid.mjs template rfp rfp.md

Keep every line of it. Put each answer below under its matching line. A line
with no answer here: answer it from the project sheet. An answer whose line is
gone from the live template: drop it. Then `check rfp rfp.md` before posting.
-->

Checkboxes: tick each one only when it is true. After the "author has been notified" box, add:
I am the original app author.

APPLICATION ID: <com.example.app>

Metadata block, from the recipe:
- Categories: <the recipe's categories>
- License: <SPDX id>
- AuthorName / AuthorEmail: <the owner's public name and contact address>
- SourceCode: https://github.com/<owner>/<app>
- IssueTracker: https://github.com/<owner>/<app>/issues
- AutoName: <App name>
- RepoType: git
- Repo: https://github.com/<owner>/<app>-android
- Leave the fields with no value empty: AuthorWebSite, WebSite, Donate, Bitcoin, LiberaPay.

Why do you want this app added to F-Droid: <one or two sentences on what the app is for and who
uses it. If the F-Droid build differs from the upstream build, say what it leaves out, in one
sentence: "The F-Droid build has no internet permission, no crash reporting and no update checks.">

Summary: <at most 80 characters; never mention Android, FLOSS, open source or free software>

Description: <what the app does, objectively: its main features as a short list, the interface
languages, and which anti-feature applies and why. No repository links here: the template says
so, and the mirror is already in Repo:.>
