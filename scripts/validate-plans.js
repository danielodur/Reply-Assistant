#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const requiredFiles = [
  'AGENT_STATUS.md',
  'INTEGRATION_GUIDE.md',
  'docs/ARCHITECTURE.md',
  'docs/API_CONTRACTS.md',
  'docs/DATA_FLOW.md',
  'docs/DECISIONS.log',
  'references/CODEX_CAPABILITIES.md',
  'references/CLAUDE_CODE_SCOPE.md',
  'references/SHARED_CONTEXT.json',
  'references/DEPENDENCIES.md',
  'plans/codex-current-plan.md',
  'plans/codex-completed-tasks.log',
  'plans/claude-code-current-plan.md',
  'plans/claude-code-completed-tasks.log',
  'projects/active-features.md',
  'projects/blockers.md',
  'projects/next-priorities.md',
  'templates/codex-plan-template.md',
  'templates/claude-code-plan-template.md',
  'templates/task-completion-template.md',
  '.agent/codex-integration.instructions',
  '.agent/sync-behavior.md',
];

function fail(message) {
  console.error(`agents validation failed: ${message}`);
  process.exit(1);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

for (const file of requiredFiles) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    fail(`missing ${file}`);
  }
  if (fs.statSync(full).size === 0) {
    fail(`${file} is empty`);
  }
}

let shared;
try {
  shared = JSON.parse(read('references/SHARED_CONTEXT.json'));
} catch (error) {
  fail(`references/SHARED_CONTEXT.json is invalid JSON: ${error.message}`);
}

for (const key of ['lastUpdated', 'app', 'coordination', 'verification']) {
  if (!Object.prototype.hasOwnProperty.call(shared, key)) {
    fail(`SHARED_CONTEXT.json missing ${key}`);
  }
}

const integration = read('INTEGRATION_GUIDE.md');
if (!integration.includes('Do not edit `.claude/*` for routine app changes')) {
  fail('INTEGRATION_GUIDE.md must preserve the routine .claude edit rule');
}

const agents = read('AGENTS.md');
if (!agents.includes('INTEGRATION_GUIDE.md') || !agents.includes('AGENT_STATUS.md')) {
  fail('AGENTS.md must point Codex at the master files');
}

const claude = read('CLAUDE.md');
if (!claude.includes('INTEGRATION_GUIDE.md') || !claude.includes('AGENT_STATUS.md')) {
  fail('CLAUDE.md must point Claude Code at the master files');
}

// Every Codex and Claude Code agent + skill must reference master coordination files,
// otherwise drift can re-introduce the old "sync the peer" workflow.
const masterTokens = ['AGENT_STATUS.md', 'INTEGRATION_GUIDE.md', 'SHARED_CONTEXT.json', 'master files'];

function listFiles(dir, suffix) {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((name) => name.endsWith(suffix))
    .map((name) => path.join(dir, name));
}

function listSkillFiles(dir) {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) return [];
  const out = [];
  for (const sub of fs.readdirSync(full)) {
    const candidate = path.join(dir, sub, 'SKILL.md');
    if (fs.existsSync(path.join(root, candidate))) out.push(candidate);
  }
  return out;
}

const coordinationCheckTargets = [
  ...listFiles('agents', '.toml'),
  ...listFiles('.claude/agents', '.md'),
  ...listSkillFiles('.agents/skills'),
  ...listSkillFiles('.claude/skills'),
];

for (const file of coordinationCheckTargets) {
  const text = read(file);
  if (!masterTokens.some((token) => text.includes(token))) {
    fail(`${file} must reference master coordination files (one of: ${masterTokens.join(', ')})`);
  }
}

console.log('agent plan validation OK');
