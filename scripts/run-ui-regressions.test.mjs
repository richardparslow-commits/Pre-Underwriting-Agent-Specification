import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { discover } from './run-ui-regressions.mjs';
test('new and nested TS/TSX regressions are discovered without editing package scripts', () => {
  const root = mkdtempSync(join(tmpdir(), 'ui-discovery-'));
  try {
    mkdirSync(join(root, 'new-feature'));
    for (const file of ['new.test.ts', 'new-feature/form.test.tsx', 'helper.ts', 'test.ts.txt']) writeFileSync(join(root, file), '');
    assert.deepEqual(discover(root), [join(root, 'new-feature/form.test.tsx'), join(root, 'new.test.ts')]);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
test('an empty suite is observable rather than silently replaced with a sample test', () => {
  const root = mkdtempSync(join(tmpdir(), 'ui-empty-'));
  try { assert.deepEqual(discover(root), []); } finally { rmSync(root, { recursive: true, force: true }); }
});
