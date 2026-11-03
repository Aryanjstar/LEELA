import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { chromium, expect } from '@playwright/test';

const dir = await mkdtemp(join(tmpdir(), 'scenespindle-e2e-'));
const dbName = 'scenespindle_test_' + randomUUID().replaceAll('-', '');
const origin = 'http://127.0.0.1:3221';
const dbHost = '127.0.0.1:27932';
const uri = 'mongodb://' + dbHost + '/' + dbName;
const processes = [];
let browser;
function launch(command, args, env = process.env) {
  const child = spawn(command, args, { env, stdio: 'inherit' });
  const stopped = new Promise(resolve => child.once('exit', resolve));
  processes.push({ child, stopped });
  return child;
}
try {
  const mongo = launch('mongod', ['--dbpath', dir, '--port', '27932', '--bind_ip', '127.0.0.1', '--replSet', 'journey', '--logpath', join(dir, 'mongo.log')]);
  await mongoose.connect(uri + '?directConnection=true', { serverSelectionTimeoutMS: 10000 });
  assert.equal(mongo.exitCode, null, 'Test database failed to start');
  const options = await mongoose.connection.db.admin().command({ getCmdLineOpts: 1 });
  assert.equal(options.parsed.storage.dbPath, dir);
  await mongoose.connection.db.admin().command({ replSetInitiate: { _id: 'journey', members: [{ _id: 0, host: dbHost }] } });
  await mongoose.disconnect();
  await mongoose.connect(uri + '?replicaSet=journey');
  const app = launch(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', '3221'], {
    ...process.env, MONGODB_URI: uri + '?replicaSet=journey', MONGODB_DB: dbName, APP_ORIGIN: origin,
    AUTH_TOKEN_PEPPER: randomUUID(), GEMINI_API_KEY: '', ELEVENLABS_API_KEY: '', SARVAM_API_KEY: ''
  });
  for (let i = 0; i < 100; i++) {
    assert.equal(app.exitCode, null, 'Test app failed to start');
    if ((await fetch(origin + '/sign-in').catch(() => null))?.ok) break;
    await sleep(100);
  }
  browser = await chromium.launch({ channel: process.env.E2E_BROWSER_CHANNEL || 'chrome' });
  const projects = [];
  const errors = [];
  for (const width of [1280, 390]) {
    const email = width + '@example.invalid';
    const password = randomUUID();
    await mongoose.connection.db.collection('users').insertOne({ email, name: 'Creator ' + width, passwordHash: await bcrypt.hash(password, 12), passwordChangedAt: new Date() });
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(origin + '/sign-in');
    await page.getByPlaceholder('Email').fill(email);
    await page.getByPlaceholder('Password').fill(password);
    await page.getByRole('button', { name: 'Enter the studio' }).click();
    await page.getByPlaceholder('A topic, in one sentence').fill('Local example ' + width);
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await expect(page.getByPlaceholder('Topic', { exact: true })).toHaveValue('Local example ' + width);
    await page.getByLabel('Title', { exact: true }).fill('Renamed ' + width);
    await page.getByRole('button', { name: 'Rename', exact: true }).click();
    await expect(page.getByText('Project renamed', { exact: true })).toBeVisible();
    await page.getByPlaceholder('Audience').fill('New readers');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByPlaceholder('Audience')).toHaveValue('New readers');
    await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Renamed ' + width);
    const scenes = Array.from({ length: 4 }, (_, index) => ({
      id: 's' + (index + 1), purpose: index === 0 ? 'hook' : 'explain',
      lines: [{ id: 'l1', text: 'A simple example line.' }], background: { kind: 'style' },
      layers: [{ id: 'title', component: 'text.title@1', props: { text: 'Example' }, slot: 'title' }], events: [],
    }));
    const plan = { schemaVersion: 1, mode: 'explainer', title: 'A simple example', logline: 'A short example plan.',
      language: 'en', format: '9x16', targetMs: 45000, styleId: 'chalk-and-chai@1', voiceId: 'test', scenes };
    await page.getByRole('button', { name: 'storyboard', exact: true }).click();
    await page.getByLabel('Import a storyboard JSON file').setInputFiles({
      name: 'authored.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(plan)),
    });
    await page.getByRole('button', { name: 'Save edits' }).click();
    await expect(page.getByText('Storyboard saved', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Approve and preview' }).click();
    await expect(page.getByText('Preview ready', { exact: true })).toBeVisible();
    const frame = page.locator('iframe[title="Preview"]');
    await expect(frame).toHaveAttribute('src', /api\/videos\/[a-f0-9]+\/preview/);
    await expect(page.frameLocator('iframe[title="Preview"]').locator('body')).toContainText('Example');
    projects.push({ page, id: new URL(page.url()).pathname.split('/').pop() });
  }
  for (const [index, { page }] of projects.entries()) {
    const foreign = projects[1 - index].id;
    const status = id => page.evaluate(async projectId => (await fetch('/api/projects/' + projectId)).status, id);
    assert.equal(await status(projects[index].id), 200);
    assert.equal(await status(foreign), 404);
  }
  assert.deepEqual(errors, []);
  console.log('PASS: two creator sign-ins, desktop and phone create/save/reload, foreign project denial');
} finally {
  await browser?.close();
  await mongoose.disconnect();
  for (const { child, stopped } of processes.reverse()) {
    child.kill('SIGTERM');
    await stopped;
  }
  await rm(dir, { recursive: true, force: true });
}
