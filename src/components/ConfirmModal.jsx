import { useState } from "react";
import { Modal, Btn, Textarea } from "./UI";

export default function ConfirmModal({ open, onClose, onConfirm, title, message, variant = "danger", requireReason = false, reasonLabel = "Reason" }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (requireReason && !reason.trim()) return;
    setLoading(true);
    try {
      await onConfirm(reason);
      setReason("");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title} width={440}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ padding: "14px 16px", background: variant === "danger" ? "rgba(248,113,113,0.08)" : "rgba(251,191,36,0.08)", borderRadius: 10, border: `1px solid ${variant === "danger" ? "rgba(248,113,113,0.2)" : "rgba(251,191,36,0.2)"}`, fontSize: 14, color: "var(--text2)", lineHeight: 1.6 }}>
          {message}
        </div>
        {requireReason && (
          <Textarea label={reasonLabel + " *"} placeholder="Please provide a reason..." rows={3} value={reason} onChange={e => setReason(e.target.value)} />
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={onClose} variant="secondary" fullWidth>Cancel</Btn>
          <Btn onClick={handle} loading={loading} variant={variant} fullWidth disabled={requireReason && !reason.trim()}>Confirm</Btn>
        </div>
      </div>
    </Modal>
  );
}
