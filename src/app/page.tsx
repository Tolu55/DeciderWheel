"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CreateDecisionForm } from "@/components/CreateDecisionForm";
import { CreatorHistoryModal } from "@/components/CreatorHistoryModal";
import { SupabaseSetupModal } from "@/components/SupabaseSetupModal";

export default function HomePage() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);

  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => setSupabaseConfigured(Boolean(data.supabaseConfigured)))
      .catch(() => {});

    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(
          localStorage.getItem("decider_wheel_creator_history") || "[]"
        );
        setHistoryCount(saved.length);
      } catch {
        setHistoryCount(0);
      }
    }
  }, []);

  return (
    <div className="mobile-shell">
      {/* Brand Header */}
      <div className="top-brand-row flex-between">
        <Link href="/" className="brand-link">
          <span className="brand-wheel-circle">
            <span className="dot-slice d1" />
            <span className="dot-slice d2" />
            <span className="dot-slice d3" />
            <span className="dot-slice d4" />
          </span>
          <span className="brand-text">Mystery Spin</span>
        </Link>

        <div className="top-nav-actions">
          <button
            type="button"
            onClick={() => setSetupOpen(true)}
            className="btn-status-pill"
            title="Database status"
          >
            <span className={`status-dot-sm ${supabaseConfigured ? "is-live" : "is-fallback"}`} />
            <span>{supabaseConfigured ? "Supabase" : "Local Mode"}</span>
          </button>

          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="btn-history-pill"
            title="Your created decisions"
          >
            <span>📜</span>
            {historyCount > 0 && <span className="counter-badge">{historyCount}</span>}
          </button>
        </div>
      </div>

      {/* Main Title */}
      <h1 className="question-title">
        Create a Mystery Spin
      </h1>

      <p className="unspun-subtitle mb-4">
        Enter choices and share the link. Slices stay hidden until your friend spins!
      </p>

      {/* Creator Form */}
      <CreateDecisionForm />

      {/* Footer */}
      <footer className="footer-simple">
        <span>© 2026 Mystery Spin • No Spoilers</span>
      </footer>

      {/* Modals */}
      <CreatorHistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />

      <SupabaseSetupModal
        isOpen={setupOpen}
        onClose={() => setSetupOpen(false)}
        isConfigured={supabaseConfigured}
      />
    </div>
  );
}
