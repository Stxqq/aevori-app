import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout as pause } from 'node:timers/promises';
import { createAgent, validateAgentResult } from '../server/agent.mjs';
const owner = { id: 'owner' },
  friend = { id: 'friend' },
  local = { type: 'ollama', local: true };
const result = {
  summary: 'Entwurf fertig.',
  steps: ['Idee ordnen'],
  actions: [
    { kind: 'note', title: 'Projekt', content: 'Ein klarer Entwurf.' },
    { kind: 'task', title: 'Entwurf prüfen', content: 'Überprüfe die drei Prioritäten.' },
  ],
};
function fixture(
  t,
  request = async () =>
    new Response(JSON.stringify({ message: { content: JSON.stringify(result) } })),
) {
  const dir = mkdtempSync(path.join(tmpdir(), 'aevori-agent-')),
    file = path.join(dir, 'agent.json');
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return { file, agent: createAgent({ file, request }) };
}
async function finished(agent, actor = owner) {
  for (let i = 0; i < 100; i++) {
    const run = agent.state(actor).runs[0];
    if (run.status !== 'running') return run;
    await pause(5);
  }
  throw new Error('Test job did not finish');
}

test('Agent memories are private, durable, optional, and profile validation is atomic', (t) => {
  const { agent, file } = fixture(t);
  agent.remember(owner, { kind: 'avoid', content: 'Keine Emojis.' });
  assert.match(agent.context(owner), /Keine Emojis/);
  assert.equal(agent.context(friend), '');
  assert.equal(agent.state(friend).memories.length, 0);
  agent.profile(owner, { memoryEnabled: false });
  assert.equal(agent.context(owner), '');
  assert.equal(agent.state(owner).memories.length, 1);
  assert.throws(() => agent.profile(owner, { name: 'Changed', tone: 'bad' }));
  assert.equal(agent.state(owner).name, 'Aeri');
  const restored = createAgent({ file });
  assert.equal(restored.state(owner).memoryEnabled, false);
  restored.forget(friend, agent.state(owner).memories[0].id);
  assert.equal(restored.state(owner).memories.length, 1);
  restored.forget(owner, agent.state(owner).memories[0].id);
  assert.equal(restored.state(owner).memories.length, 0);
  assert.equal(statSync(file).mode & 0o777, 0o600);
});

test('Every generated action requires approval by its own user; decisions are idempotent', async (t) => {
  const { agent, file } = fixture(t);
  agent.start(owner, { goal: 'Plane ein Projekt' }, local, 'fixture');
  const run = await finished(agent);
  assert.equal(run.status, 'review');
  assert.equal(agent.state(owner).artifacts.length, 0);
  assert.throws(
    () => agent.decide(friend, { runId: run.id, actionId: run.actions[0].id, decision: 'approve' }),
    /not found/,
  );
  agent.decide(owner, { runId: run.id, actionId: run.actions[0].id, decision: 'approve' });
  agent.decide(owner, { runId: run.id, actionId: run.actions[0].id, decision: 'approve' });
  agent.decide(owner, { runId: run.id, actionId: run.actions[1].id, decision: 'reject' });
  assert.equal(agent.state(owner).artifacts.length, 1);
  assert.equal(agent.state(owner).runs[0].status, 'done');
  agent.archive(owner, run.id);
  assert.equal(agent.state(owner).runs[0].archived, true);
  agent.archive(owner, run.id, false);
  assert.equal(agent.state(owner).runs[0].archived, false);
  assert.equal(createAgent({ file }).state(owner).artifacts[0].content, result.actions[0].content);
});

test('Action rules are enforced after inference and again at approval, even when the model ignores them', async (t) => {
  let release;
  const response = new Promise((resolve) => (release = resolve));
  const { agent } = fixture(t, async () => (await response).clone());
  agent.start(owner, { goal: 'Create both' }, local, 'fixture');
  agent.profile(owner, { policy: { note: 'allow', task: 'block' } });
  release(new Response(JSON.stringify({ message: { content: JSON.stringify(result) } })));
  const run = await finished(agent);
  assert.deepEqual(
    run.actions.map((a) => a.status),
    ['approved', 'blocked'],
  );
  assert.deepEqual(
    agent.state(owner).artifacts.map((a) => a.kind),
    ['note'],
  );
  agent.profile(owner, { policy: { note: 'ask', task: 'ask' } });
  agent.start(owner, { goal: 'Next' }, local, 'fixture');
  const next = await finished(agent);
  agent.profile(owner, { policy: { note: 'block' } });
  agent.decide(owner, { runId: next.id, actionId: next.actions[0].id, decision: 'approve' });
  assert.equal(agent.state(owner).runs[0].actions[0].status, 'blocked');
  assert.equal(agent.state(owner).artifacts.length, 1);
});

test('Agent rejects cloud providers, unsupported actions and duplicate running jobs; stop and restart preserve state', async (t) => {
  let release;
  const response = new Promise((resolve) => (release = resolve));
  const { agent, file } = fixture(t, async () => response);
  assert.throws(
    () => agent.start(owner, { goal: 'Test' }, { type: 'compatible', local: false }, 'cloud'),
    /local Ollama/,
  );
  assert.throws(
    () =>
      validateAgentResult({
        ...result,
        actions: [{ kind: 'shell', title: 'x', content: 'rm -rf' }],
      }),
    /Unsupported/,
  );
  const run = agent.start(owner, { goal: 'Test' }, local, 'fixture');
  assert.throws(() => agent.start(owner, { goal: 'Again' }, local, 'fixture'), /still working/);
  assert.throws(() => agent.stop(friend, run.id), /not found/);
  const restarted = createAgent({ file }).state(owner);
  assert.equal(restarted.runs[0].status, 'interrupted');
  assert.equal(restarted.messages.at(-1).kind, 'error');
  assert.equal(createAgent({ file }).state(owner).messages.length, restarted.messages.length);
  agent.stop(owner, run.id);
  release(new Response(JSON.stringify({ message: { content: JSON.stringify(result) } })));
  await pause(10);
  assert.equal(agent.state(owner).runs[0].status, 'stopped');
  assert.equal(agent.state(owner).artifacts.length, 0);
});

test('Revoking one member stops only their local work', async (t) => {
  let release;
  const response = new Promise((resolve) => (release = resolve));
  const { agent } = fixture(t, async () => (await response).clone());
  agent.start(owner, { goal: 'Owner' }, local, 'fixture');
  agent.start(friend, { goal: 'Friend' }, local, 'fixture');
  agent.stopAll(friend);
  assert.equal(agent.state(friend).runs[0].status, 'stopped');
  assert.equal(agent.state(owner).runs[0].status, 'running');
  release(new Response(JSON.stringify({ message: { content: JSON.stringify(result) } })));
  await finished(agent);
  assert.equal(agent.state(friend).artifacts.length, 0);
});

test('Characters persist per member without changing memories, policies or agent work', (t) => {
  const { agent, file } = fixture(t),
    appearance = { shape: 'cat', color: '#A7C9E9', eyes: 'happy', accessory: 'headphones' };
  agent.remember(owner, { kind: 'prefer', content: 'Kurz antworten.' });
  const saved = agent.profile(owner, { name: 'Milo', appearance });
  assert.equal(saved.name, 'Milo');
  assert.equal(saved.characterConfigured, true);
  assert.equal(saved.appearance.color, '#a7c9e9');
  assert.equal(saved.memories[0].content, 'Kurz antworten.');
  assert.deepEqual(saved.policy, { note: 'ask', task: 'ask' });
  assert.equal(agent.state(friend).characterConfigured, false);
  assert.equal(agent.state(friend).name, 'Aeri');
  const restored = createAgent({ file });
  assert.deepEqual(restored.state(owner).appearance, saved.appearance);
  assert.equal(restored.state(owner).name, 'Milo');
  assert.equal(restored.state(friend).characterConfigured, false);
});

test('Invalid character input is rejected atomically and never accepts markup or asset URLs', (t) => {
  const { agent } = fixture(t),
    initial = agent.state(owner),
    valid = initial.appearance;
  for (const appearance of [
    null,
    [],
    { ...valid, color: 'red' },
    { ...valid, color: '#123' },
    { ...valid, color: 'url(https://example.com)' },
    { ...valid, shape: '<svg>' },
    { ...valid, eyes: 'unknown' },
    { ...valid, accessory: 'script' },
    { ...valid, asset: 'https://example.com/avatar.svg' },
  ]) {
    assert.throws(() => agent.profile(owner, { name: 'Do not save', appearance }));
    assert.deepEqual(agent.state(owner), initial);
  }
});

test('Existing named agents keep their legacy color and work when the character editor is introduced', (t) => {
  const { agent, file } = fixture(t);
  agent.profile(owner, { name: 'Existing', tone: 'rose' });
  agent.remember(owner, { kind: 'fact', content: 'Bestehende Erinnerung' });
  const db = JSON.parse(readFileSync(file, 'utf8'));
  delete db.users.owner.appearance;
  delete db.users.owner.characterConfigured;
  writeFileSync(file, JSON.stringify(db));
  const restored = createAgent({ file }),
    state = restored.state(owner);
  assert.equal(state.name, 'Existing');
  assert.equal(state.appearance.color, '#df84b2');
  assert.equal(state.appearance.shape, 'aeri');
  assert.equal(state.characterConfigured, false);
  assert.equal(state.memories.length, 1);
});

test('Agent chat answers naturally without structured actions and includes private conversation context', async (t) => {
  const requests = [];
  const { agent, file } = fixture(t, async (_, __, options) => {
    requests.push(JSON.parse(options.body));
    return new Response(
      JSON.stringify({
        message: {
          content:
            requests.length === 1
              ? 'Hallo! Wie kann ich dir helfen?'
              : 'Du hast gerade Hallo gesagt.',
        },
      }),
    );
  });
  agent.start(owner, { goal: 'Hallo', mode: 'chat' }, local, 'fixture');
  let run = await finished(agent);
  assert.equal(run.mode, 'chat');
  assert.equal(run.archived, true);
  assert.deepEqual(run.actions, []);
  assert.equal(agent.state(owner).artifacts.length, 0);
  assert.equal(requests[0].format, undefined);
  agent.start(owner, { goal: 'Was habe ich gesagt?', mode: 'chat' }, local, 'fixture');
  await finished(agent);
  assert.equal(requests[1].messages.length, 4);
  assert.equal(requests[1].messages[1].content, 'Hallo');
  assert.equal(requests[1].messages[2].role, 'assistant');
  assert.equal(agent.state(friend).messages.length, 0);
  assert.equal(createAgent({ file }).state(owner).messages.length, 4);
  const reply = agent.state(owner).messages.at(-1);
  assert.throws(() => agent.read(friend, { id: reply.id }), /not found/);
  agent.read(owner, { id: reply.id });
  assert.equal(agent.state(owner).readAt, reply.created);
});

test('Background work publishes its real result once, with the same approval identity', async (t) => {
  const { agent } = fixture(t);
  const run = agent.start(owner, { goal: 'Projekt vorbereiten' }, local, 'fixture');
  assert.equal(agent.state(owner).messages[0].role, 'user');
  await finished(agent);
  const messages = agent.state(owner).messages;
  assert.equal(messages.length, 2);
  assert.equal(messages[1].kind, 'result');
  assert.equal(messages[1].runId, run.id);
  assert.equal(messages[1].content, result.summary);
  assert.equal(agent.state(owner).artifacts.length, 0);
});

test('Scheduled in-app messages survive restart, deliver once, stay private and can be cancelled', (t) => {
  const { file } = fixture(t);
  let time = 1000;
  let agent = createAgent({ file, now: () => time });
  assert.throws(() => agent.remind(owner, { text: 'Too early', at: 1000 }), /Choose a time/);
  assert.throws(() => agent.remind(owner, { text: 'Invalid', at: NaN }), /Choose a time/);
  agent.remind(owner, { text: 'Entwurf prüfen', at: 2000 });
  agent.deliverDue();
  assert.equal(agent.state(owner).messages.length, 0);
  agent = createAgent({ file, now: () => time });
  time = 2001;
  agent.deliverDue();
  agent.deliverDue();
  assert.equal(agent.state(owner).messages.length, 1);
  assert.equal(agent.state(owner).messages[0].kind, 'reminder');
  assert.equal(agent.state(friend).messages.length, 0);
  agent = createAgent({ file, now: () => time });
  agent.deliverDue();
  assert.equal(agent.state(owner).messages.length, 1);
  agent.remind(owner, { text: 'Cancelled', at: 3000 });
  const next = agent.state(owner).reminders.at(-1);
  agent.cancelReminder(friend, { id: next.id });
  assert.equal(agent.state(owner).reminders.length, 2);
  agent.cancelReminder(owner, { id: next.id });
  time = 4000;
  agent.deliverDue();
  assert.equal(agent.state(owner).messages.length, 1);
});

test('Stopping a chat never emits the late model response; failed replies become visible messages', async (t) => {
  let release;
  const response = new Promise((resolve) => (release = resolve));
  const { agent } = fixture(t, async () => response);
  const run = agent.start(owner, { goal: 'Hi', mode: 'chat' }, local, 'fixture');
  agent.stop(owner, run.id);
  release(new Response(JSON.stringify({ message: { content: 'Late' } })));
  await pause(10);
  assert.equal(agent.state(owner).messages.at(-1).kind, 'update');
  assert.equal(
    agent.state(owner).messages.some((m) => m.content === 'Late'),
    false,
  );
  const broken = fixture(t, async () => new Response('', { status: 503 })).agent;
  broken.start(owner, { goal: 'Hi', mode: 'chat' }, local, 'fixture');
  await finished(broken);
  assert.equal(broken.state(owner).messages.at(-1).kind, 'error');
});
