#!/usr/bin/env node
/**
 * OpenClaw Guard v1 — test suite
 * Exercises every scanner with synthetic diff chunks.
 */

const { SecretScanner } = require('../src/scanners/secret-scanner');
const { GhostFileScanner } = require('../src/scanners/ghost-file-scanner');
const { TodoScanner } = require('../src/scanners/todo-scanner');
const { ImportScanner } = require('../src/scanners/import-scanner');
const { ScanResults } = require('../src/scan-results');
const { formatReport } = require('../src/formatters');

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.error(`  ✗ ${label}`); }
}

function makeChunk(file, lines) {
  return {
    oldFile: file,
    newFile: file,
    hunks: [],
    addedLines: lines.map(l => ({ content: l, hunkHeader: '@@ -0,0 +1,1 @@' })),
    removedLines: [],
    isNewFile: true,
    isDeleted: false
  };
}

async function testSecretScanner() {
  console.log('\n▸ SecretScanner');
  const s = new SecretScanner();

  const chunks = [makeChunk('config.js', [
    'const key = "AKIAIOSFODNN7EXAMPLE"',
    'const ghToken = "ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij1234"',
    `const stripe = "sk_live_${'x'.repeat(24)}"`,
    `const openai = "sk-${'a'.repeat(48)}"`,
    'const db = "postgres://user:s3cret@host/db"',
    '-----BEGIN RSA PRIVATE KEY-----',
    'const safe = "hello world"',
  ])];

  const f = await s.scan(chunks);
  assert('detects AWS key', f.some(x => x.type === 'AWS Access Key ID'));
  assert('detects GitHub token', f.some(x => x.type === 'GitHub Token'));
  assert('detects Stripe key', f.some(x => x.type === 'Stripe Live Key'));
  assert('detects OpenAI key', f.some(x => x.type === 'OpenAI API Key'));
  assert('detects DB URL', f.some(x => x.type === 'Database URL with Password'));
  assert('detects private key', f.some(x => x.type === 'Private Key (PEM)'));
  assert('all secrets are ERROR severity', f.every(x => x.severity === 'ERROR'));
  assert('safe string not flagged', !f.some(x => x.snippet && x.snippet.includes('hello world') && x.type !== 'Generic Secret/Token'));
}

async function testTodoScanner() {
  console.log('\n▸ TodoScanner');
  const s = new TodoScanner(false);

  const chunks = [makeChunk('app.js', [
    '// TODO: fix this later',
    '// FIXME: broken edge case',
    '// HACK: workaround for now',
    '// PLACEHOLDER: replace with real logic',
    'const x = 1; // normal comment',
  ])];

  const f = await s.scan(chunks);
  assert('finds TODO', f.some(x => x.snippet.includes('TODO')));
  assert('finds FIXME', f.some(x => x.snippet.includes('FIXME')));
  assert('finds HACK', f.some(x => x.snippet.includes('HACK')));
  assert('finds PLACEHOLDER', f.some(x => x.snippet.includes('PLACEHOLDER')));
  assert('normal comment not flagged', !f.some(x => x.snippet.includes('normal comment')));

  // --fail-on-todo
  const strict = new TodoScanner(true);
  const f2 = await strict.scan(chunks);
  assert('--fail-on-todo promotes to ERROR', f2.filter(x => x.snippet.includes('TODO')).every(x => x.severity === 'ERROR'));
}

async function testImportScanner() {
  console.log('\n▸ ImportScanner');
  const s = new ImportScanner();

  const chunks = [makeChunk('src/index.js', [
    'import { foo } from "some-unknown-pkg"',
    'function stub() { return null; // TODO }',
    'const x = notImplemented("test")',
  ])];

  const f = await s.scan(chunks);
  assert('flags external import', f.some(x => x.type === 'External Import'));
  assert('flags stub function', f.some(x => x.type === 'Stub Function'));
  assert('flags unresolved symbol', f.some(x => x.type === 'Unresolved Symbol'));
}

async function testScanResults() {
  console.log('\n▸ ScanResults');
  const r = new ScanResults();
  assert('empty results have no issues', !r.hasIssues());
  assert('empty results have no errors', !r.hasErrors());

  r.addFindings('test', [{ severity: 'WARN', type: 'test' }]);
  assert('warn counts as issue', r.hasIssues());
  assert('warn is not error', !r.hasErrors());

  r.addFindings('test2', [{ severity: 'ERROR', type: 'test' }]);
  assert('error detected', r.hasErrors());
  assert('summary totals correct', r.getSummary().total === 2);
}

async function testFormatter() {
  console.log('\n▸ Formatter');
  const r = new ScanResults();
  r.addFindings('secrets', [{ severity: 'ERROR', type: 'AWS Key', file: 'x.js', line: '1', snippet: 'AKIA...', match: 'AKIA***' }]);
  const out = formatReport(r);
  assert('report contains header', out.includes('OPENCLAW GUARD'));
  assert('report contains finding', out.includes('AWS Key'));
  assert('report shows blocked', out.includes('blocked'));

  const empty = new ScanResults({ empty: true });
  const emptyOut = formatReport(empty);
  assert('empty report shows warning', emptyOut.includes('No staged'));
}

async function main() {
  console.log('OpenClaw Guard — Test Suite\n');
  await testSecretScanner();
  await testTodoScanner();
  await testImportScanner();
  await testScanResults();
  await testFormatter();

  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
