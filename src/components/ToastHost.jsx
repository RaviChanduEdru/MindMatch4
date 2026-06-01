import React, { useEffect, useState } from "react";

const TOAST_LIFETIME_MS = 4200;

/**
 * Toast that appears when a new achievement unlocks or level-up happens.
 * Listens to a global 'mm4:toast' event with detail { kind, title, body, emoji }.
 */
export default function ToastHost() {
  const [toasts, setToasts] = useState([]);

  const removeToast = (id) => {
    setToasts((arr) => arr.filter((x) => x.id !== id));
  };

  useEffect(() => {
    const handler = (e) => {
      const t = {
        id: Math.random().toString(36).slice(2),
        lifetimeMs: TOAST_LIFETIME_MS,
        ...e.detail,
      };
      setToasts((arr) => [...arr, t]);
      setTimeout(() => {
        removeToast(t.id);
      }, t.lifetimeMs);
    };
    addEventListener("mm4:toast", handler);
    return () => removeEventListener("mm4:toast", handler);
  }, []);

  if (toasts.length === 0) return null;
  return (
    <div className="toast-host">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.kind || "info"}`}
          style={{ "--toast-ms": `${t.lifetimeMs}ms` }}
        >
          <span className="toast-emoji">{t.emoji || "🎉"}</span>
          <div className="toast-body">
            <div className="toast-title">{t.title}</div>
            {t.body && <div className="toast-text">{t.body}</div>}
          </div>
          <button
            className="toast-dismiss"
            onClick={() => removeToast(t.id)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
          <span className="toast-progress" aria-hidden="true" />
        </div>
      ))}
    </div>
  );
}

export function fireToast(detail) {
  dispatchEvent(new CustomEvent("mm4:toast", { detail }));
}
