"use client";

import { useEffect, useState } from 'react';

type Direction = { id: 'clear' | 'story' | 'visual'; title: string; approach: string; tradeoff: string };
type Result = { objective: string; audience: string | null; selectedDirectionId: Direction['id'] | null; directions: Direction[]; questions: { id: string; prompt: string }[]; assumptions: string[]; research: { status: string; note: string }; contentHash: string; state: string };
type Stored = { revision: number; version: number; input: { rawRequest: string; exactScript?: string; directionId?: Direction['id'] }; result: Result; state: string };

export function BriefPanel({ projectId, suggestedRequest, audience }: { projectId: string; suggestedRequest: string; audience?: string }) {
  const [brief, setBrief] = useState<Stored | null>(null);
  const [rawRequest, setRawRequest] = useState('');
  const [exactScript, setExactScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let live = true;
    void fetch('/api/projects/' + projectId + '/brief').then(async response => {
      if (!response.ok) return;
      const body = await response.json();
      if (!live || !body.brief) return;
      setBrief(body.brief);
      setRawRequest(body.brief.input.rawRequest);
      setExactScript(body.brief.input.exactScript || '');
    }).catch(() => {});
    return () => { live = false; };
  }, [projectId]);

  async function post(path: string, body: unknown) {
    setLoading(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/projects/' + projectId + '/brief/' + path, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error?.message || 'The brief could not be saved.'); return null; }
      return data;
    } catch { setError('The studio is unavailable right now.'); return null; }
    finally { setLoading(false); }
  }

  async function refine() {
    const input = { rawRequest: rawRequest.trim() || suggestedRequest.trim(), audience: audience?.trim() || undefined, exactScript: exactScript || undefined, researchMode: 'off' };
    const data = await post('refine', { expectedRevision: brief?.revision ?? 0, input });
    if (data) { setBrief({ revision: data.revision, version: brief?.version ?? 0, input, result: data.result, state: data.state }); setNotice('Brief ready to review.'); }
  }

  async function answer(choice: Direction['id']) {
    if (!brief) return;
    const data = await post('answers', { expectedRevision: brief.revision, decisionId: 'direction', choice });
    if (data) { setBrief({ ...brief, revision: data.revision, input: { ...brief.input, directionId: choice }, result: data.result, state: data.state }); setNotice('Direction saved.'); }
  }

  async function approve() {
    if (!brief) return;
    const data = await post('approve', { expectedRevision: brief.revision, contentHash: brief.result.contentHash });
    if (data) { setBrief({ ...brief, version: data.version, state: 'approved' }); setNotice('Brief approved and saved as version ' + data.version + '.'); }
  }

  return <section className="glass panel" aria-label="Creative brief">
    <p className="kicker">Creative brief</p>
    <p className="fine">Shape the idea before planning shots. You can revise this brief later.</p>
    <label className="fine">What should this video do?
      <textarea className="field" value={rawRequest} onChange={event => setRawRequest(event.target.value)} placeholder={suggestedRequest || 'Describe the video in your own words'} maxLength={20000} />
    </label>
    <label className="fine">Exact script, if you have one
      <textarea className="field" value={exactScript} onChange={event => setExactScript(event.target.value)} placeholder="Leave blank if a script should be drafted" maxLength={30000} />
    </label>
    <button className="btn ghost" type="button" onClick={() => void refine()} disabled={loading || !(rawRequest.trim() || suggestedRequest.trim())}>Refine brief</button>
    {brief?.result ? <>
      <p><strong>What we will make:</strong> {brief.result.objective}</p>
      <p className="fine">Audience: {brief.result.audience || 'To be confirmed'} · Status: {brief.state === 'approved' ? 'Approved' : brief.result.state === 'needs_input' ? 'Choose a direction' : 'Ready for review'}</p>
      {brief.result.questions.length ? <div className="cards" aria-label="Choose a direction">
        {brief.result.directions.map(direction => <button className="clay card" key={direction.id} type="button" disabled={loading} onClick={() => void answer(direction.id)}>
          <strong>{direction.title}</strong><span>{direction.approach}</span><span className="muted">{direction.tradeoff}</span>
        </button>)}
      </div> : null}
      {brief.result.assumptions.map(item => <p className="fine" key={item}>{item}</p>)}
      {brief.result.state === 'ready_for_review' && brief.state !== 'approved' ? <button className="btn" type="button" disabled={loading} onClick={() => void approve()}>Approve brief</button> : null}
      <p className="fine">{brief.result.research.note}</p>
    </> : null}
    {notice ? <p role="status">{notice}</p> : null}
    {error ? <p className="error" role="alert">{error}</p> : null}
  </section>;
}
