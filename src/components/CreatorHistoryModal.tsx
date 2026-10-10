"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface HistoryItem {
  id: string;
  title: string;
  creator_token: string;
  optionCount: number;
  created_at: string;
  spun?: boolean;
  winner_choice?: string;
}

interface CreatorHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatorHistoryModal: React.FC<CreatorHistoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      try {
        const saved = JSON.parse(
          localStorage.getItem("decider_wheel_creator_history") || "[]"
        );
        setHistory(saved);
      } catch {
        setHistory([]);
      }
    }
  }, [isOpen]);

  const handleCopy = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/d/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    if (confirm("Clear your local decision creation history?")) {
      localStorage.removeItem("decider_wheel_creator_history");
      setHistory([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <h2 className="modal-title">Your Created Decisions</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-modal-close"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {history.length === 0 ? (
            <div className="empty-history-state">
              <span className="empty-icon">🎡</span>
              <p className="empty-title">No decisions created yet</p>
              <p className="empty-desc">
                When you create mystery wheels, they will appear here so you can monitor results and grab links anytime.
              </p>
            </div>
          ) : (
            <div className="history-list">
              {history.map((item) => (
                <div key={item.id} className="history-card">
                  <div className="history-card-top">
                    <h3 className="history-item-title">{item.title}</h3>
                    <span className="history-date">
                      {new Date(item.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="history-card-details">
                    <span className="history-pill">
                      {item.optionCount} choices
                    </span>
                    <span className="history-id">ID: {item.id}</span>
                  </div>

                  <div className="history-card-actions">
                    <Link
                      href={`/d/${item.id}?creator=true`}
                      onClick={onClose}
                      className="btn-history-view"
                    >
                      Open Status View →
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => handleCopy(item.id, e)}
                      className="btn-history-copy"
                    >
                      {copiedId === item.id ? "✓ Copied!" : "📋 Copy Link"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="modal-footer">
            <button
              type="button"
              onClick={handleClearHistory}
              className="btn-danger-text"
            >
              Clear History
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
