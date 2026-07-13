#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

run(process.execPath, ['scripts/validate-plans.js']);
run(process.execPath, ['scripts/generate-status-report.js']);
run(process.execPath, ['scripts/validate-plans.js']);
console.log('agent sync OK');
