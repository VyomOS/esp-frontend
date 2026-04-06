import { useState, useRef, useEffect } from "react";
import { chatAPI } from "../api/api";

export default function Chatbot({ onClose }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm the ESP assistant. Ask me anything about the platform — vendor registration, procurement, ESG metrics, and more." }
  ]);
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(p => [...p, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const history = messages.slice(-6);
      const res = await chatAPI.chat({ message: userMsg, history });
      setMessages(p => [...p, { role: "assistant", content: res.data.reply }]);
    } catch {
      setMessages(p => [...p, { role: "assistant", content: "Sorry, I'm having trouble connecting. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, width: 380, height: 520, background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", zIndex: 2000, boxShadow: "0 20px 60px rgba(0,0,0,0.5)", animation: "fadeUp 0.3s ease" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, var(--accent), var(--accent2))", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🤖</div>
          <div>
            <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 15 }}>ESP Assistant</div>
            <div style={{ fontSize: 11, color: "var(--accent3)" }}>● Online</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text2)", fontSize: 20, cursor: "pointer" }}>×</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "80%", padding: "10px 14px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              background: m.role === "user" ? "var(--accent)" : "var(--surface)",
              color: m.role === "user" ? "white" : "var(--text)",
              fontSize: 13, lineHeight: 1.6,
              border: m.role === "assistant" ? "1px solid var(--border)" : "none",
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ padding: "10px 16px", background: "var(--surface)", borderRadius: "18px 18px 18px 4px", border: "1px solid var(--border)", fontSize: 20 }}>
              <span style={{ animation: "pulse-glow 1s infinite" }}>···</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Ask anything..."
          style={{ flex: 1, padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text)", fontSize: 13, outline: "none" }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{ padding: "10px 16px", background: "var(--accent)", border: "none", borderRadius: "var(--radius-sm)", color: "white", cursor: "pointer", fontSize: 16, transition: "all 0.2s" }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
