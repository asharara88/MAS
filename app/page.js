'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);
const EDGE_FN = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-agent`;
const catClass = (c) => `cat-badge cat-${c || 'operations'}`;

function useCopy() {
  const [copied, setCopied] = useState(null);
  const copy = useCallback((text, label) => {
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }, []);
  return { copied, copy };
}

function timeAgo(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 0) return 'just now';
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function StatusBadge({ status }) {
  const map = {
    completed: { c: '#22c55e' }, running: { c: '#3b82f6' }, failed: { c: '#ef4444' },
    blocked_by_audit: { c: '#f59e0b', l: 'blocked' }, pending: { c: '#94a3b8' },
    done: { c: '#22c55e' }, open: { c: '#f59e0b' }, resolved: { c: '#22c55e' },
    dismissed: { c: '#94a3b8' }, acknowledged: { c: '#3b82f6', l: 'ack' },
  };
  const m = map[status] || { c: '#94a3b8' };
  const label = m.l || status || 'unknown';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, padding: '2px 7px',
      borderRadius: 3, background: m.c + '22', color: m.c, fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.05em', whiteSpace: 'nowrap'
    }}>
      <span style={{ width: 5, height: 5, borderRadius: 3, background: m.c }} />
      {label}
    </span>
  );
}

function VerdictBadge({ verdict }) {
  if (!verdict || verdict === 'not_required') return null;
  const map = { approved: '#22c55e', escalated: '#f59e0b', blocked: '#ef4444' };
  const c = map[verdict] || '#94a3b8';
  return (
    <span style={{
      fontSize: 9, padding: '2px 5px', borderRadius: 3, background: c + '22', color: c,
      fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap'
    }}>
      audit: {verdict}
    </span>
  );
}

const card = {
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: 12,
  marginBottom: 8,
  background: 'rgba(255,255,255,0.02)'
};

// =============================================================
// Library tab — browse templates, generate specs (the original Build flow)
// =============================================================
function Section({ title, children, open: defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="sect">
      <button className="sect-toggle" onClick={() => setOpen(!open)}>
        <span>{title}</span>
        <span className={`sect-arrow ${open ? 'open' : ''}`}>▼</span>
      </button>
      <div className={`sect-body ${open ? '' : 'hidden'}`}>{children}</div>
    </div>
  );
}

function Code({ code, lang = 'sql', onCopy }) {
  return (
    <div className="code-wrap">
      <div className="code-bar">
        <span>{lang}</span>
        <button className="btn btn-ghost btn-sm" onClick={() => onCopy(code, lang)}>Copy</button>
      </div>
      <pre>{code}</pre>
    </div>
  );
}

function AgentResult({ agent, version, onCopy }) {
  if (!agent) return null;
  return (
    <div className="result">
      <div className="result-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="result-title">{agent.agent_name}</div>
          <div className="result-id">{agent.agent_id}</div>
          <div className="result-desc">{agent.description}</div>
          <div className="result-meta">
            {agent.phase && <span className="meta-chip">Phase {agent.phase}</span>}
            {agent.estimated_setup_time && <span className="meta-chip">{agent.estimated_setup_time}</span>}
            {version && <span className="meta-chip">v{version}</span>}
          </div>
        </div>
        <button className="btn btn-ghost" onClick={() => onCopy(agent, 'Full JSON')}>Copy JSON</button>
      </div>
      <Section title="System Prompt" open={true}>
        <Code code={agent.system_prompt || ''} lang="prompt" onCopy={onCopy} />
      </Section>
      {agent.supabase_tables?.length > 0 && (
        <Section title={`Supabase Tables (${agent.supabase_tables.length})`}>
          <table className="dtable">
            <thead><tr><th>Table</th><th>Columns</th><th>Purpose</th></tr></thead>
            <tbody>
              {agent.supabase_tables.map((t, i) => (
                <tr key={i}>
                  <td>{t.name}</td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{t.columns}</td>
                  <td>{t.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}
      {agent.sql_migration && (
        <Section title="SQL Migration"><Code code={agent.sql_migration} lang="sql" onCopy={onCopy} /></Section>
      )}
      {agent.tools_and_apis?.length > 0 && (
        <Section title="Tools & APIs">
          <ul className="dlist">{agent.tools_and_apis.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </Section>
      )}
      {agent.inter_agent_connections?.length > 0 && (
        <Section title={`Inter-Agent Connections (${agent.inter_agent_connections.length})`}>
          <table className="dtable">
            <thead><tr><th>Agent</th><th>Direction</th><th>Data</th></tr></thead>
            <tbody>{agent.inter_agent_connections.map((c, i) => (
              <tr key={i}><td>{c.agent}</td><td>{c.direction}</td><td>{c.data}</td></tr>
            ))}</tbody>
          </table>
        </Section>
      )}
      {agent.escalation_triggers?.length > 0 && (
        <Section title="Escalation Triggers">
          <ul className="dlist">{agent.escalation_triggers.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </Section>
      )}
      {agent.test_scenarios?.length > 0 && (
        <Section title={`Test Scenarios (${agent.test_scenarios.length})`}>
          {agent.test_scenarios.map((t, i) => (
            <div key={i} style={{ marginBottom: 10, padding: 10, background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 600, fontSize: 12 }}>{t.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>Input: {t.input}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>Expected: {t.expected_output}</div>
            </div>
          ))}
        </Section>
      )}
      <Section title="Inputs, Outputs & Dependencies">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          {['inputs', 'outputs', 'dependencies'].map((key) => (
            <div key={key}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }}>{key}</div>
              <ul className="dlist">{(agent[key] || []).map((x, i) => <li key={i}>{x}</li>)}</ul>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function LibraryTab() {
  const [verticals, setVerticals] = useState([]);
  const [selVertical, setSelVertical] = useState(null);
  const [entities, setEntities] = useState([]);
  const [selEntity, setSelEntity] = useState(null);
  const [agents, setAgents] = useState([]);
  const [selAgent, setSelAgent] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [result, setResult] = useState(null);
  const [usage, setUsage] = useState(null);
  const [version, setVersion] = useState(null);
  const [error, setError] = useState(null);
  const streamRef = useRef(null);
  const { copied, copy } = useCopy();

  useEffect(() => {
    supabase.from('verticals').select('*').eq('is_active', true).order('sort_order').then(({ data }) => {
      if (data?.length) { setVerticals(data); setSelVertical(data[0]); }
    });
  }, []);
  useEffect(() => {
    if (!selVertical) { setEntities([]); setSelEntity(null); return; }
    supabase.from('entities').select('*').eq('vertical_id', selVertical.id).eq('is_active', true).order('sort_order')
      .then(({ data }) => { setEntities(data || []); setSelEntity(data?.[0] || null); });
  }, [selVertical]);
  useEffect(() => {
    if (!selEntity) { setAgents([]); setSelAgent(null); return; }
    supabase.from('agent_definitions').select('*').eq('entity_id', selEntity.id).order('sort_order')
      .then(({ data }) => { setAgents(data || []); setSelAgent(null); });
  }, [selEntity]);

  const generate = async () => {
    const prompt = customPrompt.trim();
    if (!selEntity || (!selAgent && !prompt)) return;
    setGenerating(true); setStreamText(''); setResult(null); setUsage(null); setVersion(null); setError(null);
    const body = { entity_id: selEntity.id };
    if (selAgent && !prompt) body.agent_id = selAgent.agent_id;
    if (prompt) body.custom_prompt = prompt;
    try {
      const res = await fetch(EDGE_FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + (await res.text()));
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '', acc = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          try {
            const evt = JSON.parse(raw);
            if (evt.type === 'token') {
              acc += evt.text; setStreamText(acc);
              if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
            } else if (evt.type === 'complete') {
              setResult(evt.agent); setUsage(evt.usage); setVersion(evt.version); setGenerating(false);
            } else if (evt.type === 'error') {
              setError(evt.message); setGenerating(false);
            }
          } catch (e) { /* ignore parse error mid-stream */ }
        }
      }
      setGenerating(false);
    } catch (e) { setError(e.message); setGenerating(false); }
  };

  const canGen = selEntity && (selAgent || customPrompt.trim());

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sb-section">
          <div className="sb-label">Vertical</div>
          <div className="v-pills">{verticals.map((v) => (
            <button key={v.id} className={`v-pill ${selVertical?.id === v.id ? 'active' : ''}`} onClick={() => setSelVertical(v)}>
              {v.icon} {v.name}
            </button>
          ))}</div>
        </div>
        {entities.length > 0 && (
          <div className="sb-section">
            <div className="sb-label">Entity</div>
            <div className="e-list">{entities.map((e) => (
              <div key={e.id} className={`e-item ${selEntity?.id === e.id ? 'active' : ''}`} onClick={() => setSelEntity(e)}>
                <div className="e-item-name">{e.icon} {e.name}</div>
                <div className="e-item-desc">{e.description}</div>
              </div>
            ))}</div>
          </div>
        )}
        {agents.length > 0 && (
          <div className="sb-section">
            <div className="sb-label">Agent Templates ({agents.length})</div>
            <div className="agent-grid">{agents.map((a) => (
              <div key={a.id} className={`ag-item ${selAgent?.id === a.id ? 'active' : ''}`}
                onClick={() => { setSelAgent(selAgent?.id === a.id ? null : a); setCustomPrompt(''); }}>
                <div className="ag-info">
                  <div className="ag-name">{a.agent_name}</div>
                  <div className="ag-desc">{a.description}</div>
                </div>
                <span className={catClass(a.category)}>{a.category}</span>
              </div>
            ))}</div>
          </div>
        )}
        {selEntity && (
          <div className="custom-area">
            <textarea className="custom-input" placeholder={`Describe a custom agent for ${selEntity.name}...`} value={customPrompt}
              onChange={(e) => { setCustomPrompt(e.target.value); if (e.target.value.trim()) setSelAgent(null); }} />
          </div>
        )}
        <div className="gen-bar">
          <button className="btn btn-accent" disabled={!canGen || generating} onClick={generate}>
            {generating ? <><span className="dot live" style={{ width: 6, height: 6 }} /> Generating...</> : 'Generate Spec'}
          </button>
        </div>
      </aside>
      <main className="main">
        {selEntity && (
          <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
            <span>{selVertical?.icon} {selVertical?.name}</span>
            <span style={{ color: 'var(--border-active)' }}>›</span>
            <span style={{ color: 'var(--text-secondary)' }}>{selEntity.icon} {selEntity.name}</span>
            {selAgent && (<><span style={{ color: 'var(--border-active)' }}>›</span><span style={{ color: 'var(--text)' }}>{selAgent.agent_name}</span></>)}
            <span style={{ marginLeft: 'auto', fontSize: 11 }}>{selEntity.region} · {selEntity.currency}</span>
          </div>
        )}
        {(generating || streamText) && (
          <div className="terminal">
            <div className="terminal-bar">
              <div className="terminal-status">
                <span className={`dot ${generating ? 'live' : error ? 'err' : ''}`} />
                <span>{generating ? 'Generating spec for ' + (selAgent?.agent_name || 'custom agent') + '...' : error ? 'Error' : 'Complete'}</span>
              </div>
              {streamText && <button className="btn btn-ghost btn-sm" onClick={() => copy(streamText, 'Raw')}>Copy raw</button>}
            </div>
            <div className="terminal-body" ref={streamRef}>{streamText}{generating && <span className="cursor" />}</div>
            {usage && (
              <div className="usage-strip">
                <span>IN <span className="val">{usage.input_tokens?.toLocaleString()}</span></span>
                <span>OUT <span className="val">{usage.output_tokens?.toLocaleString()}</span></span>
                <span>COST <span className="val">${usage.cost_usd}</span></span>
              </div>
            )}
          </div>
        )}
        {error && <div className="error-box"><strong>Error:</strong> {error}</div>}
        {result && <AgentResult agent={result} version={version} onCopy={copy} />}
        {!generating && !streamText && !result && !error && (
          <div className="empty">
            <div className="empty-icon">⚡</div>
            <div className="empty-title">Library — design agent specs</div>
            <div className="empty-desc">Pick a vertical → entity → template, or describe a custom agent. Specs are reference designs; promote one to a runnable instance from the Active tab.</div>
          </div>
        )}
      </main>
      {copied && <div className="toast">Copied: {copied}</div>}
    </div>
  );
}

// =============================================================
// Active tab — agent_instances with toggles, triggers, last-run stats
// =============================================================
function ActiveTab() {
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('agent_instances')
      .select('*, entity:entities(name, icon), vertical:verticals(name, icon)')
      .order('created_at', { ascending: false });
    const ids = (data || []).map((i) => i.id);
    let stats = {};
    if (ids.length) {
      const { data: runs } = await supabase
        .from('agent_runs').select('instance_id, status, started_at, cost_usd')
        .in('instance_id', ids).order('started_at', { ascending: false });
      stats = (runs || []).reduce((acc, r) => {
        if (!acc[r.instance_id]) acc[r.instance_id] = { last: r.started_at, last_status: r.status, count24h: 0, cost24h: 0 };
        const d = (Date.now() - new Date(r.started_at).getTime()) / 1000;
        if (d < 86400) { acc[r.instance_id].count24h++; acc[r.instance_id].cost24h += parseFloat(r.cost_usd || 0); }
        return acc;
      }, {});
    }
    setInstances((data || []).map((i) => ({ ...i, _stats: stats[i.id] || {} })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (inst) => {
    await supabase.from('agent_instances').update({ is_active: !inst.is_active }).eq('id', inst.id);
    load();
  };

  return (
    <div className="shell" style={{ display: 'block' }}>
      <main className="main" style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Active Agents</h2>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{instances.length} instances</span>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={load}>Refresh</button>
        </div>
        {loading && instances.length === 0 && <div style={{ color: 'var(--text-muted)' }}>Loading...</div>}
        {!loading && instances.length === 0 && (
          <div className="empty">
            <div className="empty-icon">🛠</div>
            <div className="empty-title">No instances yet</div>
            <div className="empty-desc">Generate a spec in the Library tab and promote it to an instance.</div>
          </div>
        )}
        {instances.map((inst) => (
          <div key={inst.id} style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => setExpanded(expanded === inst.id ? null : inst.id)}
                style={{ background: 'transparent', border: 0, color: 'var(--text-muted)', cursor: 'pointer', padding: 0, fontSize: 12 }}>
                {expanded === inst.id ? '▾' : '▸'}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 14 }}>{inst.display_name}</strong>
                  <code style={{ fontSize: 11, color: 'var(--text-muted)' }}>{inst.slug}</code>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>v{inst.version}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                  {inst.vertical?.icon} {inst.vertical?.name} · {inst.entity?.icon} {inst.entity?.name} · {inst.model}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-muted)', minWidth: 110 }}>
                <div>{inst._stats.count24h ?? 0} runs / 24h</div>
                <div>${(inst._stats.cost24h || 0).toFixed(4)}</div>
                {inst._stats.last && <div>last {timeAgo(inst._stats.last)}</div>}
              </div>
              <button onClick={() => toggleActive(inst)} className="btn btn-sm" style={{
                background: inst.is_active ? '#22c55e22' : '#94a3b822',
                color: inst.is_active ? '#22c55e' : '#94a3b8',
                border: 0, padding: '4px 10px', fontWeight: 600
              }}>
                {inst.is_active ? 'Active' : 'Inactive'}
              </button>
            </div>
            {expanded === inst.id && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Triggers</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {(inst.trigger_types || []).map((t) => (
                        <span key={t} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: 'var(--bg)', color: 'var(--text-secondary)' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Tools</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {(inst.tool_names || []).map((t) => (
                        <span key={t} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: 'var(--bg)', color: 'var(--text-secondary)' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <details>
                  <summary style={{ cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)' }}>System prompt + config</summary>
                  <pre style={{ fontSize: 10, marginTop: 8, padding: 10, background: 'var(--bg)', borderRadius: 4, overflow: 'auto', maxHeight: 320, whiteSpace: 'pre-wrap' }}>
{inst.system_prompt}

--- config ---
{JSON.stringify(inst.config, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}

// =============================================================
// Runs tab — live tail of agent_runs + tool_calls inspector
// =============================================================
function RunsTab() {
  const [runs, setRuns] = useState([]);
  const [filter, setFilter] = useState('all');
  const [instances, setInstances] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const { copied, copy } = useCopy();

  const load = useCallback(async () => {
    if (!loading) setLoading(false);
    const { data: insts } = await supabase.from('agent_instances').select('id, slug, display_name');
    setInstances(insts || []);
    let q = supabase.from('agent_runs')
      .select('*, instance:agent_instances(slug, display_name)')
      .order('started_at', { ascending: false }).limit(50);
    if (filter !== 'all') q = q.eq('instance_id', filter);
    const { data } = await q;
    setRuns(data || []);
    setLoading(false);
  }, [filter, loading]);

  useEffect(() => { load(); }, [filter]);
  useEffect(() => { const i = setInterval(load, 5000); return () => clearInterval(i); }, [filter]);

  return (
    <div className="shell" style={{ display: 'block' }}>
      <main className="main" style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Live Runs</h2>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{runs.length} shown · auto-refresh 5s</span>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{
            marginLeft: 'auto', background: 'var(--bg)', color: 'var(--text)',
            border: '1px solid var(--border)', borderRadius: 4, padding: '4px 8px', fontSize: 12
          }}>
            <option value="all">All instances</option>
            {instances.map((i) => <option key={i.id} value={i.id}>{i.slug}</option>)}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
        </div>
        {loading && runs.length === 0 && <div style={{ color: 'var(--text-muted)' }}>Loading...</div>}
        {!loading && runs.length === 0 && (
          <div className="empty">
            <div className="empty-icon">📡</div>
            <div className="empty-title">No runs yet</div>
            <div className="empty-desc">Trigger an agent via webhook or manual call. Runs will stream in here.</div>
          </div>
        )}
        {runs.map((r) => (
          <div key={r.id} style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                style={{ background: 'transparent', border: 0, color: 'var(--text-muted)', cursor: 'pointer', padding: 0, fontSize: 12 }}>
                {expanded === r.id ? '▾' : '▸'}
              </button>
              <code style={{ fontSize: 11, color: 'var(--text)' }}>{r.instance?.slug || '?'}</code>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.trigger_type}</span>
              <StatusBadge status={r.status} />
              <VerdictBadge verdict={r.audit_verdict} />
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                {r.input_tokens || 0}+{r.output_tokens || 0}t · ${parseFloat(r.cost_usd || 0).toFixed(4)} · {timeAgo(r.started_at)}
              </span>
            </div>
            {expanded === r.id && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                {r.audit_reasoning && (
                  <div style={{ marginBottom: 10, fontSize: 11, color: 'var(--text-secondary)', padding: 8, background: 'var(--bg)', borderLeft: '3px solid #f59e0b', borderRadius: 4 }}>
                    <strong>Audit reasoning:</strong> {r.audit_reasoning}
                  </div>
                )}
                {r.error && (
                  <div style={{ marginBottom: 10, fontSize: 11, color: '#ef4444', padding: 8, background: '#ef444411', borderLeft: '3px solid #ef4444', borderRadius: 4 }}>
                    <strong>Error:</strong> {r.error}
                  </div>
                )}
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                  Tool Calls ({(r.tool_calls || []).length})
                </div>
                {(r.tool_calls || []).map((tc, i) => (
                  <div key={i} style={{ fontSize: 11, marginBottom: 8, padding: 8, background: 'var(--bg)', borderRadius: 4 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                      <strong>{i + 1}. {tc.name}</strong>
                      {tc.audit && <VerdictBadge verdict={tc.audit.verdict} />}
                      {tc.result?.error && <span style={{ fontSize: 10, color: '#ef4444' }}>error</span>}
                    </div>
                    <details>
                      <summary style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: 10 }}>input · result · audit</summary>
                      <pre style={{ fontSize: 10, marginTop: 4, overflow: 'auto', maxHeight: 240, whiteSpace: 'pre-wrap' }}>
{JSON.stringify({ input: tc.input, result: tc.result, audit: tc.audit }, null, 2)}
                      </pre>
                    </details>
                  </div>
                ))}
                {r.result && (
                  <details style={{ marginTop: 10 }}>
                    <summary style={{ cursor: 'pointer', fontSize: 10, color: 'var(--text-muted)' }}>Final result</summary>
                    <pre style={{ fontSize: 10, marginTop: 4, padding: 8, background: 'var(--bg)', borderRadius: 4, overflow: 'auto', maxHeight: 280, whiteSpace: 'pre-wrap' }}>
{JSON.stringify(r.result, null, 2)}
                    </pre>
                  </details>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => copy(r, 'run JSON')} style={{ marginTop: 8 }}>Copy full run JSON</button>
              </div>
            )}
          </div>
        ))}
        {copied && <div className="toast">Copied: {copied}</div>}
      </main>
    </div>
  );
}

// =============================================================
// Inbox tab — human_escalations queue
// =============================================================
function InboxTab() {
  const [escalations, setEscalations] = useState([]);
  const [filter, setFilter] = useState('open');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('human_escalations')
      .select('*, lead:leads(full_name, phone_e164, source, score, temperature)')
      .order('created_at', { ascending: false }).limit(50);
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    setEscalations(data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id, status) => {
    await supabase.from('human_escalations').update({
      status,
      resolved_at: (status === 'resolved' || status === 'dismissed') ? new Date().toISOString() : null
    }).eq('id', id);
    load();
  };

  const sevColor = (s) => s === 'critical' ? '#ef4444' : s === 'high' ? '#f59e0b' : '#94a3b8';

  return (
    <div className="shell" style={{ display: 'block' }}>
      <main className="main" style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Human Escalations</h2>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{escalations.length}</span>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{
            marginLeft: 'auto', background: 'var(--bg)', color: 'var(--text)',
            border: '1px solid var(--border)', borderRadius: 4, padding: '4px 8px', fontSize: 12
          }}>
            <option value="open">Open</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
            <option value="all">All</option>
          </select>
          <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
        </div>
        {loading && escalations.length === 0 && <div style={{ color: 'var(--text-muted)' }}>Loading...</div>}
        {!loading && escalations.length === 0 && (
          <div className="empty">
            <div className="empty-icon">📥</div>
            <div className="empty-title">Inbox empty</div>
            <div className="empty-desc">No {filter} escalations.</div>
          </div>
        )}
        {escalations.map((e) => (
          <div key={e.id} style={card}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{
                fontSize: 9, padding: '2px 6px', borderRadius: 3,
                background: sevColor(e.severity) + '22', color: sevColor(e.severity),
                textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', whiteSpace: 'nowrap'
              }}>{e.severity}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, marginBottom: 4 }}>
                  {e.lead && <strong>{e.lead.full_name || 'Unnamed'}</strong>}
                  {!e.lead && <span style={{ color: 'var(--text-muted)' }}>No lead linked</span>}
                  {e.lead && (
                    <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                      {e.lead.source} · {e.lead.temperature} · score {e.lead.score} · {e.lead.phone_e164}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{e.reason}</div>
                {(e.rules_checked || []).length > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                    {e.rules_checked.map((r) => (
                      <span key={r} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'var(--bg)', color: 'var(--text-muted)' }}>{r}</span>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>{timeAgo(e.created_at)}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                <StatusBadge status={e.status} />
                {e.status === 'open' && (
                  <>
                    <button className="btn btn-sm" style={{ background: '#22c55e22', color: '#22c55e', border: 0, padding: '4px 10px', fontWeight: 600 }} onClick={() => setStatus(e.id, 'resolved')}>Resolve</button>
                    <button className="btn btn-sm" style={{ background: '#94a3b822', color: '#94a3b8', border: 0, padding: '4px 10px', fontWeight: 600 }} onClick={() => setStatus(e.id, 'dismissed')}>Dismiss</button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}

// =============================================================
// Root
// =============================================================
export default function Home() {
  const [tab, setTab] = useState('library');
  const [openCount, setOpenCount] = useState(0);

  // Open-escalations badge counter (cheap polled count)
  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase.from('human_escalations').select('id', { count: 'exact', head: true }).eq('status', 'open');
      setOpenCount(count || 0);
    };
    fetchCount();
    const i = setInterval(fetchCount, 10000);
    return () => clearInterval(i);
  }, []);

  return (
    <>
      <nav className="nav">
        <div className="nav-brand">
          <div className="nav-mark">AF</div>
          <div className="nav-title">Agent Factory <span>· Runtime</span></div>
        </div>
        <div className="nav-tabs">
          <button className={`nav-tab ${tab === 'library' ? 'active' : ''}`} onClick={() => setTab('library')}>Library</button>
          <button className={`nav-tab ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>Active</button>
          <button className={`nav-tab ${tab === 'runs' ? 'active' : ''}`} onClick={() => setTab('runs')}>Runs</button>
          <button className={`nav-tab ${tab === 'inbox' ? 'active' : ''}`} onClick={() => setTab('inbox')}>
            Inbox{openCount > 0 && <span style={{ marginLeft: 6, fontSize: 10, padding: '1px 5px', borderRadius: 3, background: '#f59e0b22', color: '#f59e0b', fontWeight: 700 }}>{openCount}</span>}
          </button>
        </div>
      </nav>
      {tab === 'library' && <LibraryTab />}
      {tab === 'active' && <ActiveTab />}
      {tab === 'runs' && <RunsTab />}
      {tab === 'inbox' && <InboxTab />}
    </>
  );
}
