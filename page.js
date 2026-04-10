"use client";
import { useState, useEffect, useRef } from "react";
import { PREDEFINED_AGENTS } from "../lib/prompts";

/* ─── tiny helpers ─── */
function cn(...c) { return c.filter(Boolean).join(" "); }

function Pill({ children, color = "gray" }) {
  const map = {
    green: { bg: "#e8f8ef", fg: "#1a7a42", b: "#b8e6cc" },
    blue: { bg: "#e6f1fb", fg: "#0c447c", b: "#b5d4f4" },
    amber: { bg: "#faeeda", fg: "#854f0b", b: "#fac775" },
    coral: { bg: "#faece7", fg: "#993c1d", b: "#f5c4b3" },
    purple: { bg: "#eeedfe", fg: "#3c3489", b: "#cecbf6" },
    gray: { bg: "#f1efe8", fg: "#5f5e5a", b: "#d3d1c7" },
    red: { bg: "#fcebeb", fg: "#a32d2d", b: "#f7c1c1" },
  };
  const c = map[color] || map.gray;
  return <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: c.bg, color: c.fg, border: `1px solid ${c.b}`, letterSpacing: 0.2 }}>{children}</span>;
}

function Copy({ text, label = "Copy" }) {
  const [ok, set] = useState(false);
  return <button onClick={() => { navigator.clipboard.writeText(text); set(true); setTimeout(() => set(false), 2e3); }} style={{ padding: "4px 14px", borderRadius: 6, border: "1px solid #d3d1c7", background: ok ? "#e8f8ef" : "#f8f7f4", color: ok ? "#1a7a42" : "#5f5e5a", cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all .2s", fontFamily: "inherit" }}>{ok ? "Copied" : label}</button>;
}

function Fold({ title, badge, open: init = false, children }) {
  const [open, set] = useState(init);
  return (
    <div style={{ marginBottom: 10, border: "1px solid #e8e6df", borderRadius: 10, overflow: "hidden" }}>
      <button onClick={() => set(!open)} style={{ width: "100%", padding: "12px 16px", background: "#faf9f6", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "inherit", fontSize: 14, fontWeight: 600, color: "#2c2c2a" }}>
        <span>{title} {badge && <Pill color="blue">{badge}</Pill>}</span>
        <span style={{ fontSize: 11, opacity: .45, transform: open ? "rotate(180deg)" : "", transition: "transform .2s" }}>▼</span>
      </button>
      {open && <div style={{ padding: 16, borderTop: "1px solid #e8e6df", background: "#fff" }}>{children}</div>}
    </div>
  );
}

function Code({ code, label }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        {label && <span style={{ fontSize: 11, fontWeight: 600, color: "#888780", textTransform: "uppercase", letterSpacing: .8 }}>{label}</span>}
        <Copy text={code} />
      </div>
      <pre style={{ background: "#faf9f6", padding: 14, borderRadius: 8, fontSize: 12.5, lineHeight: 1.6, overflowX: "auto", margin: 0, fontFamily: "'JetBrains Mono', monospace", color: "#2c2c2a", border: "1px solid #e8e6df", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 400, overflowY: "auto" }}>{code}</pre>
    </div>
  );
}

/* ─── agent output renderer ─── */
function AgentCard({ a }) {
  return (
    <div style={{ animation: "fadeUp .5s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1a1a2e", letterSpacing: -.3 }}>{a.agent_name}</h2>
        <Pill color="purple">Phase {a.phase}</Pill>
        <Pill color="amber">{a.estimated_setup_time}</Pill>
        <Pill color="gray">{a.agent_id}</Pill>
      </div>
      <p style={{ color: "#666", fontSize: 14, lineHeight: 1.7, margin: "0 0 20px" }}>{a.description}</p>
      {a.dependencies?.length > 0 && <div style={{ marginBottom: 16, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}><span style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>REQUIRES:</span>{a.dependencies.map((d,i) => <Pill key={i} color="coral">{d}</Pill>)}</div>}

      <Fold title="System prompt" badge={`${a.system_prompt?.length || 0} chars`} open>
        <Code code={a.system_prompt} label="Paste into n8n HTTP Request → System message" />
      </Fold>

      <Fold title="SQL migration" badge="Ready to run" open>
        <Code code={a.sql_migration} label="Paste into Supabase SQL Editor → Click Run" />
      </Fold>

      <Fold title="Supabase tables" badge={`${a.supabase_tables?.length || 0}`}>
        {a.supabase_tables?.map((t, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Pill color="blue">{t.name}</Pill>
              <span style={{ fontSize: 12, color: "#888" }}>{t.description}</span>
            </div>
            <code style={{ fontSize: 12, color: "#5f5e5a", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6 }}>{t.columns}</code>
          </div>
        ))}
      </Fold>

      <Fold title="n8n workflows" badge={`${a.n8n_workflows?.length || 0}`}>
        {a.n8n_workflows?.map((w, i) => (
          <div key={i} style={{ marginBottom: 16, padding: 14, background: "#faf9f6", borderRadius: 8, border: "1px solid #e8e6df" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <strong style={{ fontSize: 14, color: "#1a1a2e" }}>{w.name}</strong>
              <Pill color="green">{w.trigger}</Pill>
            </div>
            <p style={{ fontSize: 13, color: "#666", margin: "0 0 10px", lineHeight: 1.5 }}>{w.description}</p>
            <ol style={{ margin: 0, paddingLeft: 20 }}>
              {w.nodes?.map((n, j) => <li key={j} style={{ fontSize: 12, color: "#5f5e5a", marginBottom: 3 }}>{n}</li>)}
            </ol>
          </div>
        ))}
      </Fold>

      <Fold title="Tools, inputs, outputs & escalation">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {[
            { label: "Tools & APIs", items: a.tools_and_apis, color: "blue" },
            { label: "Escalation triggers", items: a.escalation_triggers, color: "red" },
            { label: "Inputs", items: a.inputs, color: "green" },
            { label: "Outputs", items: a.outputs, color: "amber" },
          ].map((sec, i) => (
            <div key={i}>
              <h4 style={{ margin: "0 0 6px", fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: .8, fontWeight: 600 }}>{sec.label}</h4>
              {sec.items?.map((t, j) => <div key={j} style={{ fontSize: 13, color: "#5f5e5a", padding: "2px 0", lineHeight: 1.5 }}>• {t}</div>)}
            </div>
          ))}
        </div>
      </Fold>

      <Fold title="Inter-agent connections" badge={`${a.inter_agent_connections?.length || 0}`}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {a.inter_agent_connections?.map((c, i) => (
            <div key={i} style={{ padding: "8px 14px", borderRadius: 8, background: "#faf9f6", border: "1px solid #e8e6df", fontSize: 13 }}>
              <span style={{ fontWeight: 600, color: "#1a1a2e" }}>{c.agent}</span>
              <span style={{ margin: "0 6px", fontSize: 16, color: c.direction === "sends_to" ? "#1a7a42" : c.direction === "receives_from" ? "#0c447c" : "#8e44ad" }}>
                {c.direction === "sends_to" ? "→" : c.direction === "receives_from" ? "←" : "⇄"}
              </span>
              <span style={{ color: "#666" }}>{c.data}</span>
            </div>
          ))}
        </div>
      </Fold>

      <Fold title="Test scenarios" badge={`${a.test_scenarios?.length || 0}`}>
        {a.test_scenarios?.map((t, i) => (
          <div key={i} style={{ marginBottom: 12, padding: 14, background: "#faf9f6", borderRadius: 8, border: "1px solid #e8e6df" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e", marginBottom: 6 }}>Test {i + 1}: {t.name}</div>
            <div style={{ fontSize: 12.5, color: "#5f5e5a", lineHeight: 1.5 }}><strong>Input:</strong> {t.input}</div>
            <div style={{ fontSize: 12.5, color: "#5f5e5a", lineHeight: 1.5, marginTop: 2 }}><strong>Expected:</strong> {t.expected_output}</div>
          </div>
        ))}
      </Fold>
    </div>
  );
}

/* ─── main page ─── */
export default function Home() {
  const [apiKey, setApiKey] = useState("");
  const [keySet, setKeySet] = useState(false);
  const [selected, setSelected] = useState(null);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [raw, setRaw] = useState(null);
  const [history, setHistory] = useState([]);
  const [usage, setUsage] = useState(null);
  const outRef = useRef(null);

  // Load API key from localStorage
  useEffect(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("mc-api-key");
    if (saved) { setApiKey(saved); setKeySet(true); }
    const hist = typeof window !== "undefined" && localStorage.getItem("mc-agent-history");
    if (hist) try { setHistory(JSON.parse(hist)); } catch {}
  }, []);

  function saveKey() {
    if (apiKey.startsWith("sk-ant-")) {
      localStorage.setItem("mc-api-key", apiKey);
      setKeySet(true);
      setError(null);
    } else {
      setError("API key must start with sk-ant-");
    }
  }

  function clearKey() {
    localStorage.removeItem("mc-api-key");
    setApiKey("");
    setKeySet(false);
  }

  async function generate() {
    const isCustom = selected === PREDEFINED_AGENTS.length;
    const prompt = isCustom ? `Create a custom agent for Mi Casa Real Estate: ${custom}` : PREDEFINED_AGENTS[selected].prompt;

    setLoading(true);
    setError(null);
    setResult(null);
    setRaw(null);
    setUsage(null);

    try {
      const resp = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, apiKey }),
      });
      const data = await resp.json();

      if (data.error) {
        setError(data.error);
        if (data.raw) setRaw(data.raw);
        return;
      }

      setResult(data.agent);
      setUsage(data.usage);
      const entry = { name: data.agent.agent_name, id: data.agent.agent_id, time: new Date().toLocaleString(), phase: data.agent.phase };
      const newHist = [entry, ...history].slice(0, 20);
      setHistory(newHist);
      localStorage.setItem("mc-agent-history", JSON.stringify(newHist));

      setTimeout(() => outRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e) {
      setError(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  const isCustom = selected === PREDEFINED_AGENTS.length;
  const canGen = keySet && selected !== null && (!isCustom || custom.trim().length > 20);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
        ::selection { background: rgba(233,69,96,.15); }
      `}</style>

      {/* Header */}
      <header style={{ background: "#1a1a2e", padding: "24px 0", borderBottom: "3px solid #E94560" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: "linear-gradient(135deg, #0F3460, #E94560)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 700 }}>A</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: -.3 }}>Mi Casa Agent Factory</h1>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,.5)" }}>Describe → Generate → Deploy</p>
            </div>
          </div>
          {keySet && (
            <button onClick={clearKey} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid rgba(255,255,255,.15)", background: "transparent", color: "rgba(255,255,255,.6)", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
              Change API key
            </button>
          )}
        </div>
      </header>

      <main style={{ maxWidth: 820, margin: "0 auto", padding: "32px 24px" }}>

        {/* API Key Setup */}
        {!keySet && (
          <div style={{ background: "#fff", borderRadius: 14, padding: 28, border: "1px solid #e8e6df", marginBottom: 28, animation: "fadeUp .4s ease" }}>
            <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700, color: "#1a1a2e" }}>Connect your Anthropic API key</h2>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#888", lineHeight: 1.5 }}>Your key is stored in your browser only — never sent to any server except Anthropic directly. Get one at <a href="https://console.anthropic.com" target="_blank" style={{ color: "#0F3460" }}>console.anthropic.com</a></p>
            <div style={{ display: "flex", gap: 10 }}>
              <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-ant-api03-..."
                onKeyDown={e => e.key === "Enter" && saveKey()}
                style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid #d3d1c7", fontSize: 14, fontFamily: "'JetBrains Mono', monospace", outline: "none", background: "#faf9f6" }}
              />
              <button onClick={saveKey} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#0F3460", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Save</button>
            </div>
          </div>
        )}

        {/* Agent Selection */}
        {keySet && (
          <div style={{ animation: "fadeUp .4s ease" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Select agent to create</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
              {PREDEFINED_AGENTS.map((a, i) => (
                <button key={i} onClick={() => setSelected(i)}
                  style={{
                    padding: "10px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .2s", fontFamily: "inherit",
                    border: selected === i ? "2px solid #E94560" : "1px solid #d3d1c7",
                    background: selected === i ? "rgba(233,69,96,.06)" : "#fff",
                    color: selected === i ? "#E94560" : "#5f5e5a",
                  }}>
                  {a.label}
                  {selected === i && <span style={{ display: "block", fontSize: 11, fontWeight: 400, color: "#888", marginTop: 2 }}>{a.description}</span>}
                </button>
              ))}
              <button onClick={() => setSelected(PREDEFINED_AGENTS.length)}
                style={{
                  padding: "10px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .2s", fontFamily: "inherit",
                  border: isCustom ? "2px solid #8e44ad" : "1px dashed #d3d1c7",
                  background: isCustom ? "rgba(142,68,173,.06)" : "#fff",
                  color: isCustom ? "#8e44ad" : "#888",
                }}>
                + Custom agent
              </button>
            </div>

            {/* Custom prompt */}
            {isCustom && (
              <div style={{ marginBottom: 24, animation: "fadeUp .3s ease" }}>
                <textarea value={custom} onChange={e => setCustom(e.target.value)} rows={4}
                  placeholder="Describe your agent in detail. Example: Create a Viewing Scheduler Agent that coordinates property viewings between buyers and sellers, manages Google Calendar bookings, sends viewing reminders via WhatsApp 24h and 2h before, collects feedback after each viewing, and tracks no-show rates per agent..."
                  style={{
                    width: "100%", padding: 16, borderRadius: 10, border: "1px solid #d3d1c7",
                    background: "#fff", color: "#2c2c2a", fontSize: 14, lineHeight: 1.6,
                    resize: "vertical", outline: "none", fontFamily: "inherit",
                  }}
                />
                <div style={{ fontSize: 11, color: "#b4b2a9", marginTop: 4 }}>{custom.length} characters — the more specific you are, the better the output</div>
              </div>
            )}

            {/* Generate button */}
            <button onClick={generate} disabled={!canGen || loading}
              style={{
                width: "100%", padding: "16px 24px", borderRadius: 10, border: "none", fontSize: 16, fontWeight: 700,
                cursor: canGen && !loading ? "pointer" : "not-allowed", transition: "all .3s", fontFamily: "inherit",
                background: canGen && !loading ? "linear-gradient(135deg, #0F3460, #E94560)" : "#d3d1c7",
                color: canGen && !loading ? "#fff" : "#888",
                letterSpacing: -.2,
              }}>
              {loading ? <span style={{ animation: "pulse 1.5s ease-in-out infinite" }}>Generating full agent package...</span> : "Generate agent"}
            </button>

            {/* Usage info */}
            {usage && (
              <div style={{ marginTop: 10, fontSize: 11, color: "#b4b2a9", display: "flex", gap: 16 }}>
                <span>Input: {usage.input_tokens?.toLocaleString()} tokens</span>
                <span>Output: {usage.output_tokens?.toLocaleString()} tokens</span>
                <span>Est. cost: ~${((usage.input_tokens * 3 + usage.output_tokens * 15) / 1e6).toFixed(3)}</span>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ marginTop: 16, padding: 16, borderRadius: 10, background: "#fcebeb", border: "1px solid #f7c1c1", color: "#a32d2d", fontSize: 13, lineHeight: 1.5 }}>
            <strong>Error:</strong> {error}
            {raw && <Code code={raw} label="Raw API response (for debugging)" />}
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div style={{ marginTop: 20, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#b4b2a9", fontWeight: 700, textTransform: "uppercase", letterSpacing: .8 }}>History:</span>
            {history.map((h, i) => <Pill key={i} color="green">{h.name} — Phase {h.phase}</Pill>)}
          </div>
        )}

        {/* Result */}
        {result && (
          <div ref={outRef} style={{ marginTop: 36, paddingTop: 28, borderTop: "2px solid #e8e6df" }}>
            <AgentCard a={result} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ textAlign: "center", padding: "24px", fontSize: 12, color: "#b4b2a9" }}>
        Mi Casa Real Estate · Agent Factory v1.0 · API calls go directly to Anthropic
      </footer>
    </div>
  );
}
