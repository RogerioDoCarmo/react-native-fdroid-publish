# GitLab: fork, RFP, recipe, merge request

The submission happens on gitlab.com: an **RFP** issue in `fdroid/rfp` (the request), and a
**merge request** into `fdroid/fdroiddata` (the recipe). Every public text is drafted by
[writing-for-fdroid.md](writing-for-fdroid.md) and approved by the owner before it is posted.

## Accounts and tools (owner's steps)

1. A gitlab.com account. **Verify it (phone/SMS)** before the merge request: pipelines on a fork
   of an unverified user fail with "user not verified", and an external contributor cannot
   re-trigger them (Miroji lost a round to this).
2. Install `glab`: Windows `scoop install glab` or `winget install GLab.GLab`; macOS `brew install
   glab`; Linux, the distribution package or a release binary.
3. `glab auth login --hostname gitlab.com`, chosen by the owner in their own terminal:
   - **How would you like to sign in?** → **Web** (browser OAuth; no token is created or pasted)
   - **Default git protocol** → **HTTPS**
   - **Authenticate Git with your GitLab credentials?** → **Yes**
4. `glab auth status` shows `Logged in to gitlab.com as <user>`.

⚠️ **The agent's shell may not see the owner's login.** Desktop agent apps can run tools in a
sandbox with its own copy of the user's app-data folder; glab there reads a stale or empty config
and answers `401 Unauthorized` while the owner's terminal is logged in. Do not work around it with
tokens. Run each GitLab step **in the owner's own terminal** (a terminal pane the agent can type
into, or ask the owner to paste the command), write results to a file, and read the file.

## The helper

[../scripts/glab-fdroid.mjs](../scripts/glab-fdroid.mjs) wraps every call below in one Node file
(Node is present in any React Native project). It sends bodies as UTF-8 JSON files, refuses to
create duplicates, and stops at the first failure.

```bash
node glab-fdroid.mjs whoami
node glab-fdroid.mjs mine
```

⚠️ Shell quoting: Windows PowerShell 5.1 strips embedded double quotes from native-command
arguments, so `glab api graphql -f query='{ ... "x" ... }'` silently breaks. JSON body files
(`--input`) avoid it on every shell; that is why the helper uses them.

## 1. Fork `fdroiddata`

**One fork per app**, named `<app>-fdroid-data`, keeps each app's branches and pipelines apart; the
older Miroji fork stays untouched by OmniMorse work. (One fork with a branch per app is the other
common convention and works too; reviewers only see the merge request.)

```bash
node glab-fdroid.mjs fork <app>-fdroid-data      # about 1–2 minutes; waits for import_status=finished
```

Only the default branch (`master`) is forked: much faster, and nothing else is needed.

⚠️ **Reusing an old fork:** its `master` is frozen where upstream was when it was made. A branch cut
from it runs today's CI against old files and old lint rules. Sync it first (GitLab's **Update
fork** button, or the GraphQL `projectSyncFork` mutation) or make a new fork.

## Before any text goes out

Every RFP and merge request starts from F-Droid's **live** template, fetched at that moment. Each
body is checked, then shown to the owner:

```bash
node glab-fdroid.mjs template rfp rfp.md        # or: template mr merge-request.md
node glab-fdroid.mjs check rfp rfp.md           # or: check mr ... / check text comment.md
```

`check` reports every line of the live template the body dropped, and any other store the text
names. Every posting command runs the same check and refuses to post until it passes
(`writing-for-fdroid.md`).

## 2. Open the RFP

```bash
node glab-fdroid.mjs open-rfp "<App name>" rfp.md
```

The live template, filled in from [../templates/rfp.md](../templates/rfp.md). Note the number (`#4676`). The bot labels it within
minutes; if it adds `too-many-git-urls` (two GitHub links: source and mirror), post the explanation
from [../templates/comment-too-many-git-urls.md](../templates/comment-too-many-git-urls.md):

```bash
node glab-fdroid.mjs comment-rfp <iid> comment-too-many-git-urls.md
```

## 3. Put the recipe on a branch

The branch is named after the application ID; the file is `metadata/<applicationId>.yml`.

```bash
node glab-fdroid.mjs put-recipe <app>-fdroid-data <applicationId> recipe.yml "New app: <App name>"
```

Each later fix is the same command with a new message (`"New app: <App>: CMake and Ninja from
Debian"`); it updates the file on the branch and the merge request's pipeline reruns.

## 4. Open the merge request

```bash
node glab-fdroid.mjs open-mr <app>-fdroid-data <applicationId> "New app: <App name>" merge-request.md
```

The live template, filled in from [../templates/merge-request.md](../templates/merge-request.md),
ending `Closes rfp#<iid>` and `/label ~"New App"`. Replies to reviewers go through
`comment-mr <mr-iid> reply.md`, which runs the same check.
The helper sets: target `fdroid/fdroiddata` `master`, **allow commits from members who can merge**
(reviewers fix small things themselves), delete the branch on merge, no squash, not a draft.

## 5. Watch the pipeline

```bash
node glab-fdroid.mjs status <app>-fdroid-data <mr-iid>
```

Pipelines run **in the fork** (`merge_request_event`). Each push to the branch also runs a `push`
pipeline; both test the same recipe.

Public reads need no login, useful from a sandboxed shell:

```bash
curl -s "https://gitlab.com/api/v4/projects/fdroid%2Ffdroiddata/merge_requests/<iid>"
curl -s "https://gitlab.com/api/v4/projects/<fork-id>/pipelines/<pipeline-id>/jobs"
curl -sL "https://gitlab.com/<user>/<fork>/-/jobs/<job-id>/raw" -o job.log     # full log
```

Comments (`/notes`) on issues and MRs need a login.

⚠️ **Decode as UTF-8 before judging text.** On Windows, piping `curl` into a Python reading
`sys.stdin` decodes as cp1252 and shows `â€”` for an em dash that GitLab stored correctly. Read the
bytes (`json.loads(sys.stdin.buffer.read().decode('utf-8'))`) and compare with the source file.

## Done

The merge request is open with `Closes rfp#N` and collaboration allowed, and its pipeline has
started.
