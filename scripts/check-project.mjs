// Static artifact checks only; this does not compile TypeScript or render React.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
  entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
const files = [...walk(path.join(root, 'src')), path.join(root, 'vite.config.ts')];
let imports = 0;
for (const file of files.filter(file => /\.(tsx?|css)$/.test(file))) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)) {
    const base = path.resolve(path.dirname(file), match[1]);
    const candidates = [base, ...['.ts', '.tsx', '.css', '/index.ts', '/index.tsx'].map(extension => base + extension)];
    assert.ok(candidates.some(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile()), `Unresolved local import: ${file} -> ${match[1]}`);
    imports++;
  }
}
JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
JSON.parse(fs.readFileSync(path.join(root, 'tsconfig.json'), 'utf8'));
const config = fs.readFileSync(path.join(root, 'vite.config.ts'), 'utf8');
for (const match of config.matchAll(/src:\s*['"](\/[^'"]+\.png)['"],\s*sizes:\s*['"](\d+)x(\d+)['"]/g)) {
  const bytes = fs.readFileSync(path.join(root, 'public', match[1].slice(1)));
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(bytes.readUInt32BE(16), Number(match[2]));
  assert.equal(bytes.readUInt32BE(20), Number(match[3]));
}
assert.ok(fs.existsSync(path.join(root, 'public/favicon.svg')));
console.log(`PASS: ${imports} local imports resolve; JSON configs parse; declared PWA PNG icons match their dimensions. This is not a build or browser test.`);
