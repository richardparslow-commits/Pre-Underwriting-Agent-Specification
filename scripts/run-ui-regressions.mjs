// Discover every source UI regression; new test files must not need a CI allowlist edit.
import { readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
export function discover(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    const path = join(root, entry.name);
    return entry.isDirectory() ? discover(path) : /\.test\.tsx?$/.test(entry.name) ? [path] : [];
  }).sort();
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const files = discover(resolve('src')).map(file => relative(process.cwd(), file));
  if (!files.length) throw new Error('No UI regression tests discovered');
  console.log(`Running all ${files.length} UI regression files`);
  const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', ...files], { stdio: 'inherit' });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
