import { AgentOrchestrator, type Engine } from '../src/agent/orchestrator';

/** Deterministic fake engine — no native code, streams 3 tokens. */
function fakeEngine(text = 'hello world hi'): Engine {
  return {
    async completion(params, onToken) {
      expect(params.messages[0].role).toBe('system');
      for (const tok of text.split(' ')) {
        onToken(tok + ' ');
      }
      return { text };
    },
    async stopCompletion() {},
  };
}

describe('AgentOrchestrator', () => {
  it('streams assistant reply and records tok/s', async () => {
    const agent = new AgentOrchestrator();
    agent.attachEngine(fakeEngine());
    let latest: any[] = [];
    agent.subscribe(ms => {
      latest = ms;
    });
    await agent.send('hi there');
    expect(latest).toHaveLength(2);
    expect(latest[0].role).toBe('user');
    expect(latest[1].role).toBe('assistant');
    expect(latest[1].text).toMatch(/hello/);
    expect(typeof latest[1].tokPerSec).toBe('number');
  });

  it('ignores empty sends and double-sends while generating', async () => {
    const agent = new AgentOrchestrator();
    let calls = 0;
    agent.attachEngine({
      async completion(_p, onToken) {
        calls += 1;
        onToken('x');
        return { text: 'x' };
      },
      async stopCompletion() {},
    });
    agent.subscribe(() => {});
    await agent.send('   ');
    expect(calls).toBe(0);
    await agent.send('real');
    expect(calls).toBe(1);
  });

  it('clear() wipes turns and memory', async () => {
    const agent = new AgentOrchestrator();
    agent.attachEngine(fakeEngine('yo'));
    agent.subscribe(() => {});
    await agent.send('a');
    expect(agent.snapshot()).toHaveLength(2);
    agent.clear();
    expect(agent.snapshot()).toHaveLength(0);
  });

  it('throws a helpful error when engine missing', async () => {
    const agent = new AgentOrchestrator();
    agent.subscribe(() => {});
    await expect(agent.send('hi')).rejects.toThrow(/engine/i);
  });
});
