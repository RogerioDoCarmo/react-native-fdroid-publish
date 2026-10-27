#!/usr/bin/env node
// Repository checks, run by CI and before every release:
//   - SKILL.md frontmatter: name matches its folder and the naming rule;
//     description is one line of at most 1024 characters.
//   - every relative Markdown link points at a file that exists;
//   - plugin.json and marketplace.json parse and agree on name and version;
//   - files stay under the plugin directory's limits (256 KiB, portable names);
//   - no package launcher (npx, bunx, pnpm dlx, yarn dlx, uvx) in skill files,
//     which the Claude plugin directory treats as an unpinned download.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

const root = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const problems = [];
const fail = (file, message) => problems.push(`${relative(root, file).split(sep).join('/')}: ${message}`);

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === '.git' || entry.name === 'node_modules') return [];
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const files = walk(root);

for (const file of files) {
  const name = file.split(sep).pop();
  if (/[:<>"|?*]|[. ]$/.test(name) || /^(con|prn|aux|nul|com\d|lpt\d)(\.|$)/i.test(name)) {
    fail(file, 'file name is not portable to Windows and macOS');
  }
  if (['.DS_Store', 'Thumbs.db', 'desktop.ini'].includes(name)) fail(file, 'system file');
  if (statSync(file).size > 256 * 1024) fail(file, 'larger than 256 KiB');
}

for (const file of files.filter((f) => f.endsWith(`${sep}SKILL.md`))) {
  const text = readFileSync(file, 'utf8');
  const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!front) {
    fail(file, 'no YAML frontmatter');
    continue;
  }
  const field = (key) => new RegExp(`^${key}:\s*(.+)$`, 'm').exec(front[1])?.[1].trim();
  const name = field('name');
  const description = field('description');
  const folder = dirname(file).split(sep).pop();
  if (name !== folder) fail(file, `name "${name}" does not match folder "${folder}"`);
  if (!/^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$/.test(name ?? '')) fail(file, `name "${name}" breaks the naming rule`);
  if (!description) fail(file, 'no description');
  else if (description.length > 1024) fail(file, `description is ${description.length} characters (max 1024)`);
}

for (const file of files.filter((f) => f.endsWith('.md'))) {
  const text = readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '');
  for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    const path = resolve(dirname(file), target.split('#')[0]);
    if (!existsSync(path)) fail(file, `broken link ${target}`);
  }
}

for (const file of files.filter((f) => f.includes(`${sep}skills${sep}`))) {
  const text = readFileSync(file, 'utf8');
  const launcher = /(^|[\s`(])(npx|bunx|uvx|pnpm dlx|yarn dlx)\s/m.exec(text);
  if (launcher) fail(file, `uses the package launcher "${launcher[2]}"`);
}

const plugin = JSON.parse(readFileSync(join(root, '.claude-plugin/plugin.json'), 'utf8'));
const market = JSON.parse(readFileSync(join(root, '.claude-plugin/marketplace.json'), 'utf8'));
const listed = market.plugins.find((p) => p.name === plugin.name);
if (!listed) fail(join(root, '.claude-plugin/marketplace.json'), `does not list ${plugin.name}`);
else if (listed.version !== plugin.version) {
  fail(join(root, '.claude-plugin/marketplace.json'), `version ${listed.version} != plugin.json ${plugin.version}`);
}

if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`OK: ${files.length} files checked`);
