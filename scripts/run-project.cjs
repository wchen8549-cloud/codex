// Invoke installed tools directly, without pnpm's automatic pre-run install.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const action = process.argv[2];
const actions = {
  typecheck: [['node_modules/typescript/bin/tsc', '--noEmit']],
  build: [['node_modules/typescript/bin/tsc', '--noEmit'], ['node_modules/vite/bin/vite.js', 'build']],
  'build-android': [['node_modules/typescript/bin/tsc', '--noEmit'], ['node_modules/vite/bin/vite.js', 'build', '--mode', 'android']],
  dev: [['node_modules/vite/bin/vite.js', '--host', '0.0.0.0']],
  preview: [['node_modules/vite/bin/vite.js', 'preview', '--host', '0.0.0.0']],
};
if (!actions[action]) {
  console.error('Usage: node scripts/run-project.cjs typecheck|build|build-android|dev|preview');
  process.exit(1);
}
const taskEnv = { ...process.env };
const pathKey = Object.keys(taskEnv).find(key => key.toLowerCase() === 'path') ?? 'PATH';
taskEnv[pathKey] = path.dirname(process.execPath) + path.delimiter + (taskEnv[pathKey] ?? '');
for (const [tool, ...args] of actions[action]) {
  const toolPath = path.join(root, tool);
  if (!fs.existsSync(toolPath)) {
    console.error(`Missing installed tool: ${tool}. Run dependency installation first.`);
    process.exit(1);
  }
  const result = spawnSync(process.execPath, [toolPath, ...args], { cwd: root, env: taskEnv, stdio: 'inherit' });
  if (result.error) { console.error(result.error.message); process.exit(1); }
  if (result.status !== 0) process.exit(result.status ?? 1);
}
