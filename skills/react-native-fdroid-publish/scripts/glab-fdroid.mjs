#!/usr/bin/env node
// GitLab steps of an F-Droid submission, through the owner's own `glab` login.
//
//   node glab-fdroid.mjs whoami
//   node glab-fdroid.mjs mine                                   your forks, RFPs and fdroiddata MRs
//   node glab-fdroid.mjs fork <fork-name>                       fork fdroid/fdroiddata, wait until ready
//   node glab-fdroid.mjs put-recipe <fork-name> <appId> <recipe.yml> <commit message>
//   node glab-fdroid.mjs open-rfp <title> <body.md>
//   node glab-fdroid.mjs comment-rfp <rfp-iid> <comment.md>
//   node glab-fdroid.mjs open-mr <fork-name> <appId> <title> <body.md>
//   node glab-fdroid.mjs status <fork-name> <mr-iid>            pipeline jobs, MR state, labels
//
// Every write prints what it did and stops at the first failure. Request bodies
// go to glab as a UTF-8 JSON file (--input), never as -f arguments: that keeps
// quotes, newlines and non-ASCII text intact on every shell, Windows included.
//
// It never reads, prints or stores a token: glab holds the owner's login.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const FDROIDDATA = 'fdroid%2Ffdroiddata';
const RFP = 'fdroid%2Frfp';
const tmp = mkdtempSync(join(tmpdir(), 'glab-fdroid-'));

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

const commands = {
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

  'put-recipe'(name, appId, recipeFile, message) {
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

  'open-rfp'(title, bodyFile) {
    const existing = glab([`projects/${RFP}/issues?author_username=${me()}&search=${enc(title)}&in=title`]);
    if (existing.length > 0) throw new Error(`an RFP titled like that exists: #${existing[0].iid}`);
    const i = glab(['--method', 'POST', `projects/${RFP}/issues`], { title, description: text(bodyFile) });
    console.log(`RFP #${i.iid}  ${i.web_url}`);
  },

  'comment-rfp'(iid, commentFile) {
    const n = glab(['--method', 'POST', `projects/${RFP}/issues/${iid}/notes`], { body: text(commentFile) });
    console.log(`comment ${n.id} on rfp#${iid}`);
  },

  'open-mr'(name, appId, title, bodyFile) {
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
  process.exit(1);
}
