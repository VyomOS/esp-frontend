import { useState, useRef, useEffect } from "react";
import { chatAPI, aiAPI, notificationAPI } from "../api/api";
import { useAuth } from "../context/AuthContext";

const ROLE_CHIPS = {
  vendor: ["Help me complete my profile","How do I add my ESG score?","Why is GST verification important?","How do I bid on an RFP?"],
  buyer:  ["Help me write an RFP","How do I find women-led vendors?","What does ESG score mean?","Compare bids I've received"],
  admin:  ["How to verify a vendor","Draft a notification message","Explain the impact metrics"],
};

export default function Chatbot() {
  const { user } = useAuth();
  const role     = user?.role;

  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([]);
  const [chips, setChips]       = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const bottomRef = useRef(null);

  /* Auto-open with AI proactive greeting — once per session per role */
  useEffect(() => {
    if (!role || hasGreeted) return;
    const flagKey = `chatbot_greeted_${role}_${user?.id || "anon"}`;
    if (sessionStorage.getItem(flagKey)) return;

    setHasGreeted(true);
    sessionStorage.setItem(flagKey, "1");

    // Fetch AI proactive message + chatbot-pending notifications in parallel
    Promise.allSettled([
      aiAPI.proactiveMessage({ role, context: {} }),
      notificationAPI.chatbotPending(),
    ]).then(([pm, np]) => {
      const proactive = pm.status === "fulfilled" ? pm.value.data : null;
      const pending   = np.status === "fulfilled" ? np.value.data : [];

      let shouldOpen = false;
      const msgs = [];

      // Surface unread bid/profile notifications first
      if (pending.length > 0) {
        pending.slice(0, 2).forEach(n => {
          msgs.push({ role: "assistant", content: n.message, proactive: true });
        });
        shouldOpen = true;
      }

      // Then the personalised AI greeting
      if (proactive?.should_show && proactive?.message) {
        msgs.push({ role: "assistant", content: proactive.message, proactive: true });
        shouldOpen = true;
      } else if (msgs.length === 0) {
        // Fallback: show a default greeting but don't auto-open
        const first = (user?.name || "there").split(" ")[0];
        msgs.push({ role: "assistant", content: `Hi ${first}! Ask me anything about ESP — procurement, ESG scoring, vendor verification, and more.` });
      }

      setMessages(msgs);
      setChips(ROLE_CHIPS[role] || []);

      if (shouldOpen) {
        const t = setTimeout(() => setOpen(true), 1800);
        return () => clearTimeout(t);
      }
    });
  }, [role, user, hasGreeted]);

  /* Fallback greeting if panel opened manually before auto-greeting resolved */
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: "assistant", content: "Hi! I'm the Even Procurement assistant. Ask me anything — vendor registration, ESG scoring, procurement requests, and more." }]);
      setChips(ROLE_CHIPS[role] || []);
    }
  }, [open, messages.length, role]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, open]);

  const sendMessage = async (msgText) => {
    const msg = (msgText ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    setChips([]); // Hide chips after first interaction
    setMessages(p => [...p, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const r = await chatAPI.chat({ message: msg, history: messages.slice(-6) });
      // Backend may return either { reply } or { response }
      const replyText = r.data.reply || r.data.response || "I didn't catch that — could you rephrase?";
      setMessages(p => [...p, { role: "assistant", content: replyText }]);
    } catch {
      setMessages(p => [...p, { role: "assistant", content: "I'm having trouble connecting right now. Please try again in a moment." }]);
    } finally { setLoading(false); }
  };

  const unreadDot = !open && messages.some(m => m.role === "assistant" && m.proactive);

  return (
    <>
      {/* Floating button */}
      <button onClick={() => setOpen(o => !o)}
        style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 1999,
          width: 56, height: 56, borderRadius: "50%",
          background: "var(--navy,#0B1D33)", border: "none",
          boxShadow: "0 8px 32px rgba(11,29,51,0.3)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "var(--teal,#18664A)"; e.currentTarget.style.transform = "scale(1.06)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "var(--navy,#0B1D33)"; e.currentTarget.style.transform = ""; }}>
        {open
          ? <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 4l10 10M14 4L4 14" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
          : (<>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M3 5h16M3 11h12M3 17h14" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
                <circle cx="18" cy="17" r="3.5" fill="#22895F" stroke="#0B1D33" strokeWidth="1.5"/>
              </svg>
              {unreadDot && (
                <span style={{
                  position: "absolute", top: 6, right: 6,
                  width: 12, height: 12, borderRadius: "50%",
                  background: "var(--red,#B84232)",
                  border: "2px solid var(--navy,#0B1D33)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}/>
              )}
            </>)
        }
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: "fixed", bottom: 96, right: 28, zIndex: 2000,
          width: 400, height: 560, display: "flex", flexDirection: "column",
          background: "var(--surface, white)", border: "1px solid var(--border,#D4C9B5)",
          borderRadius: 16, boxShadow: "0 20px 64px rgba(11,29,51,0.24)",
          animation: "fadeUp 0.22s ease", overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            padding: "16px 20px",
            background: "var(--navy,#0B1D33)",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--teal,#18664A)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 15, color: "#F2EBD9" }}>ESP Assistant</div>
              <div style={{ fontSize: 11, color: "rgba(242,235,217,0.5)", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#5FCFA0", display: "inline-block" }}/>
                Online · ESG & procurement expert
              </div>
            </div>
            <button onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(242,235,217,0.6)", padding: 4, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.color = "white"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(242,235,217,0.6)"}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", background: "var(--bg, #F2EBD9)" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
                {m.role === "assistant" && (
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--teal-bg,#E4F2EB)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--teal,#18664A)", flexShrink: 0, marginRight: 8, marginTop: 2, border: "1px solid var(--border,#D4C9B5)" }}>E</div>
                )}
                <div style={{
                  maxWidth: "78%", padding: "11px 14px",
                  borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                  background: m.role === "user" ? "var(--navy,#0B1D33)" : "white",
                  color: m.role === "user" ? "var(--cream,#F2EBD9)" : "var(--navy,#0B1D33)",
                  fontSize: 13, lineHeight: 1.6,
                  border: m.role === "assistant" ? `1px solid ${m.proactive ? "var(--teal,#18664A)" : "var(--border,#D4C9B5)"}` : "none",
                  borderLeft: m.role === "assistant" && m.proactive ? "3px solid var(--teal,#18664A)" : undefined,
                  boxShadow: "0 1px 4px rgba(11,29,51,0.06)",
                }}>
                  {m.proactive && (
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--teal,#18664A)", marginBottom: 4 }}>✨ Suggested</div>
                  )}
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--teal-bg,#E4F2EB)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--teal,#18664A)", border: "1px solid var(--border,#D4C9B5)" }}>E</div>
                <div style={{ padding: "11px 14px", background: "white", borderRadius: "12px 12px 12px 2px", border: "1px solid var(--border,#D4C9B5)", display: "flex", gap: 4 }}>
                  {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--muted,#67788D)", animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}/>)}
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Quick-reply chips */}
          {chips.length > 0 && !loading && (
            <div style={{ padding: "0 16px 8px", background: "var(--bg, #F2EBD9)", display: "flex", flexWrap: "wrap", gap: 6 }}>
              {chips.map((chip, i) => (
                <button key={i} onClick={() => sendMessage(chip)}
                  style={{
                    background: "white", border: "1px solid var(--teal,#18664A)",
                    color: "var(--teal,#18664A)", borderRadius: 99,
                    padding: "6px 12px", fontSize: 11, fontWeight: 600,
                    cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--teal,#18664A)"; e.currentTarget.style.color = "white"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "var(--teal,#18664A)"; }}>
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border,#D4C9B5)", background: "white" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Ask about ESG, RFPs, vendors..."
                style={{
                  flex: 1, padding: "10px 14px", fontSize: 13,
                  background: "var(--cream, #F2EBD9)", color: "var(--navy,#0B1D33)",
                  border: "1.5px solid var(--border,#D4C9B5)", borderRadius: 8,
                  outline: "none", fontFamily: "'DM Sans',sans-serif",
                  transition: "border-color 0.15s",
                }}
                onFocus={e => e.target.style.borderColor = "var(--teal,#18664A)"}
                onBlur={e => e.target.style.borderColor = "var(--border,#D4C9B5)"}/>
              <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                style={{
                  width: 40, height: 40, borderRadius: 8, border: "none",
                  background: input.trim() && !loading ? "var(--navy,#0B1D33)" : "var(--cream-mid,#E9DFC6)",
                  color: input.trim() && !loading ? "var(--cream,#F2EBD9)" : "var(--muted,#67788D)",
                  cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s", flexShrink: 0,
                }}
                onMouseEnter={e => { if (input.trim() && !loading) e.currentTarget.style.background = "var(--teal,#18664A)"; }}
                onMouseLeave={e => { if (input.trim() && !loading) e.currentTarget.style.background = "var(--navy,#0B1D33)"; }}>
                <svg width="16" height="16" viewBox="0 0 15 15" fill="none">
                  <path d="M13 2L1 6.5L6 8.5M13 2L9 14L6 8.5M13 2L6 8.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
