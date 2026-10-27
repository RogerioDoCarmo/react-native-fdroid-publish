#!/usr/bin/env node
// GitLab steps of an F-Droid submission, through the owner's own `glab` login.
//
//   node glab-fdroid.mjs template <rfp|mr> <out.md>             F-Droid's LIVE template, to fill in
//   node glab-fdroid.mjs check <rfp|mr|text> <body.md>          what a post would be refused for
//   node glab-fdroid.mjs whoami
//   node glab-fdroid.mjs mine                                   your forks, RFPs and fdroiddata MRs
//   node glab-fdroid.mjs fork <fork-name>                       fork fdroid/fdroiddata, wait until ready
//   node glab-fdroid.mjs put-recipe <fork-name> <appId> <recipe.yml> <commit message>
//   node glab-fdroid.mjs open-rfp <title> <body.md>
//   node glab-fdroid.mjs comment-rfp <rfp-iid> <comment.md>
//   node glab-fdroid.mjs comment-mr <mr-iid> <comment.md>
//   node glab-fdroid.mjs open-mr <fork-name> <appId> <title> <body.md>
//   node glab-fdroid.mjs status <fork-name> <mr-iid>            pipeline jobs, MR state, labels
//
// Every write prints what it did and stops at the first failure. Request bodies
// go to glab as a UTF-8 JSON file (--input), never as -f arguments: that keeps
// quotes, newlines and non-ASCII text intact on every shell, Windows included.
//
// Every text it posts is checked first, and refused when it names another store
// (F-Droid judges the app on its own), or when an RFP or merge request body
// leaves out a line of F-Droid's live template (an old template got a merge
// request closed: "Merge Request template is not followed").
//
// It never reads, prints or stores a token: glab holds the owner's login.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const FDROIDDATA = 'fdroid%2Ffdroiddata';
const RFP = 'fdroid%2Frfp';
const tmp = mkdtempSync(join(tmpdir(), 'glab-fdroid-'));

// Public raw files, fetched fresh on every use and never copied into this skill.
const TEMPLATES = {
  rfp: 'https://gitlab.com/fdroid/rfp/-/raw/master/.gitlab/issue_templates/Default.md',
  mr: 'https://gitlab.com/fdroid/fdroiddata/-/raw/master/.gitlab/merge_request_templates/Default.md',
};

// Library names a reviewer needs to verify a removal ("Google Play Services",
// "Play Install Referrer") pass; a store, a store link or another platform does not.
const OTHER_STORES =
  /\b(?:Apple|App Store|iPhone|iPad|iOS|TestFlight|Google Play(?! Services)|Play Store|Play Console)\b|apps\.apple\.com|play\.google\.com/iu;

function glab(args, body) {
  const full = ['api', ...args];
  if (body !== undefined) {
    const file = join(tmp, 'body.json');
    writeFileSync(file, JSON.stringify(body), 'utf8');
    full.push('--input', file, '-H', 'Content-Type: application/json');
  }
  const out = execFileSync('glab', full, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return out.trim() === '' ? null : JSON.parse(out);
}

function tryGlab(args) {
  try {
    return glab(args);
  } catch {
    return null;
  }
}

const text = (file) => readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const enc = (path) => encodeURIComponent(path);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const me = () => glab(['user']).username;

async function liveTemplate(kind) {
  if (!TEMPLATES[kind]) throw new Error(`template kind is rfp or mr, not "${kind}"`);
  const response = await fetch(TEMPLATES[kind]);
  if (!response.ok) throw new Error(`could not fetch the live ${kind} template: HTTP ${response.status}`);
  return (await response.text()).replace(/\r\n/g, '\n');
}

// The lines of a live template a filled-in body must still carry: headings,
// field labels, every checkbox's wording, the label command and Closes rfp#N.
function templateGaps(template, body) {
  const lines = body.split('\n').map((line) => line.trim());
  const gaps = [];
  for (const raw of template.split('\n')) {
    const line = raw.trim();
    const box = /^[*-] \[[ xX]\] (.+)$/u.exec(line);
    if (box) {
      if (!body.includes(box[1].trim())) gaps.push(line);
    } else if (line.startsWith('Closes rfp#')) {
      if (!/^Closes rfp#\d+$/mu.test(body)) gaps.push(line);
    } else if (line.startsWith('/label ')) {
      if (!lines.includes(line)) gaps.push(line);
    } else {
      const head = /^#{2,4} [^:]*:?/u.exec(line)?.[0] ?? /^[A-Z][^:]{1,60}:(?=\s*$)/u.exec(line)?.[0];
      if (head && !lines.some((l) => l.startsWith(head))) gaps.push(line);
    }
  }
  return gaps;
}

async function refusals(kind, body) {
  const problems = [];
  const store = OTHER_STORES.exec(body);
  if (store) problems.push(`names "${store[0]}": F-Droid texts never name another store or platform`);
  if (kind !== 'text') {
    for (const gap of templateGaps(await liveTemplate(kind), body)) {
      problems.push(`leaves out this line of the live ${kind} template: ${gap}`);
    }
  }
  return problems;
}

async function guard(kind, file) {
  const problems = await refusals(kind, text(file));
  if (problems.length > 0) throw new Error(`${file} not posted:\n  ${problems.join('\n  ')}`);
}

const commands = {
  async template(kind, out) {
    writeFileSync(out, await liveTemplate(kind), 'utf8');
    console.log(`live ${kind} template written to ${out}; fill it in, keeping every line it asks for`);
  },

  async check(kind, file) {
    const problems = await refusals(kind, text(file));
    if (problems.length > 0) throw new Error(`${file}:\n  ${problems.join('\n  ')}`);
    console.log(`${file}: nothing to refuse`);
  },

  whoami() {
    const u = glab(['user']);
    console.log(`${u.username} (id ${u.id}, ${u.state})`);
  },

  mine() {
    const user = me();
    for (const p of glab([`users/${user}/projects?per_page=100`])) {
      const from = p.forked_from_project?.path_with_namespace ?? '-';
      console.log(`project  ${p.path_with_namespace}  forked_from=${from}`);
    }
    for (const i of glab([`projects/${RFP}/issues?author_username=${user}&per_page=50`])) {
      console.log(`rfp      #${i.iid} [${i.state}] ${i.title}`);
    }
    for (const m of glab([`projects/${FDROIDDATA}/merge_requests?author_username=${user}&per_page=50`])) {
      console.log(`mr       !${m.iid} [${m.state}] ${m.title}  (${m.source_branch})`);
    }
  },

  async fork(name) {
    const user = me();
    const path = `${user}/${name}`;
    if (tryGlab([`projects/${enc(path)}`])) throw new Error(`${path} already exists; not touching it`);
    const p = glab(['--method', 'POST', `projects/${FDROIDDATA}/fork`], {
      name,
      path: name,
      namespace_path: user,
      visibility: 'public',
      branches: 'master',
    });
    console.log(`fork requested: ${p.web_url}`);
    for (let i = 0; i < 240; i += 1) {
      await sleep(10_000);
      const status = glab([`projects/${enc(path)}`]).import_status;
      if (i % 6 === 0) console.log(`  import_status=${status}`);
      if (status === 'finished' || status === 'none') return console.log('fork ready');
      if (status === 'failed') throw new Error('fork failed');
    }
    throw new Error('fork did not finish within 40 minutes');
  },

  async 'put-recipe'(name, appId, recipeFile, message) {
    await guard('text', recipeFile);
    const project = enc(`${me()}/${name}`);
    const branches = glab([`projects/${project}/repository/branches?search=${enc(appId)}`]);
    if (!branches.some((b) => b.name === appId)) {
      const b = glab(['--method', 'POST', `projects/${project}/repository/branches`], {
        branch: appId,
        ref: 'master',
      });
      console.log(`branch ${appId} created at ${b.commit.id}`);
    }
    const filePath = enc(`metadata/${appId}.yml`);
    const exists = tryGlab([`projects/${project}/repository/files/${filePath}?ref=${enc(appId)}`]);
    glab(['--method', exists ? 'PUT' : 'POST', `projects/${project}/repository/files/${filePath}`], {
      branch: appId,
      content: text(recipeFile),
      commit_message: message,
    });
    const head = glab([`projects/${project}/repository/commits/${enc(appId)}`]);
    console.log(`${exists ? 'updated' : 'added'} metadata/${appId}.yml; branch head ${head.id}  ${head.title}`);
  },

  async 'open-rfp'(title, bodyFile) {
    await guard('rfp', bodyFile);
    const existing = glab([`projects/${RFP}/issues?author_username=${me()}&search=${enc(title)}&in=title`]);
    if (existing.length > 0) throw new Error(`an RFP titled like that exists: #${existing[0].iid}`);
    const i = glab(['--method', 'POST', `projects/${RFP}/issues`], { title, description: text(bodyFile) });
    console.log(`RFP #${i.iid}  ${i.web_url}`);
  },

  async 'comment-rfp'(iid, commentFile) {
    await guard('text', commentFile);
    const n = glab(['--method', 'POST', `projects/${RFP}/issues/${iid}/notes`], { body: text(commentFile) });
    console.log(`comment ${n.id} on rfp#${iid}`);
  },

  async 'comment-mr'(iid, commentFile) {
    await guard('text', commentFile);
    const n = glab(['--method', 'POST', `projects/${FDROIDDATA}/merge_requests/${iid}/notes`], {
      body: text(commentFile),
    });
    console.log(`comment ${n.id} on !${iid}`);
  },

  async 'open-mr'(name, appId, title, bodyFile) {
    await guard('mr', bodyFile);
    const user = me();
    const open = glab([
      `projects/${FDROIDDATA}/merge_requests?author_username=${user}&state=opened&source_branch=${enc(appId)}`,
    ]);
    if (open.length > 0) throw new Error(`an open MR exists: !${open[0].iid}`);
    const upstream = glab([`projects/${FDROIDDATA}`]);
    const mr = glab(['--method', 'POST', `projects/${enc(`${user}/${name}`)}/merge_requests`], {
      source_branch: appId,
      target_branch: 'master',
      target_project_id: upstream.id,
      title,
      description: text(bodyFile),
      allow_collaboration: true,
      remove_source_branch: true,
      squash: false,
    });
    console.log(`MR !${mr.iid}  ${mr.web_url}  allow_collaboration=${mr.allow_collaboration}`);
  },

  status(name, iid) {
    const mr = glab([`projects/${FDROIDDATA}/merge_requests/${iid}`]);
    console.log(`MR !${iid} [${mr.state}] labels=${mr.labels.join(',') || '-'} notes=${mr.user_notes_count}`);
    const pipe = mr.head_pipeline;
    if (!pipe) return console.log('no pipeline yet');
    console.log(`pipeline ${pipe.id} ${pipe.status}  ${pipe.web_url}`);
    const project = enc(`${me()}/${name}`);
    for (const j of glab([`projects/${project}/pipelines/${pipe.id}/jobs?per_page=50`])) {
      console.log(`  ${j.status.padEnd(8)} ${j.name}  job ${j.id}${j.failure_reason ? `  (${j.failure_reason})` : ''}`);
    }
  },
};

const [command, ...args] = process.argv.slice(2);
if (!commands[command]) {
  console.error(`commands: ${Object.keys(commands).join(', ')}`);
  process.exit(2);
}
try {
  await commands[command](...args);
} catch (error) {
  console.error(`FAILED: ${error.message}`);
  // exitCode, not exit(): exiting while fetch still holds a socket trips a
  // libuv assertion on Windows.
  process.exitCode = 1;
}
