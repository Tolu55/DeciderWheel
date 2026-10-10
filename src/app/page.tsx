"use client";

import React, { useState, useEffect } from "react";
import { CreateDecisionForm } from "@/components/CreateDecisionForm";
import { CreatorHistoryModal } from "@/components/CreatorHistoryModal";
import { SupabaseSetupModal } from "@/components/SupabaseSetupModal";

export default function HomePage() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);

  useEffect(() => {
    // Check config
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => setSupabaseConfigured(Boolean(data.supabaseConfigured)))
      .catch(() => {});

    // Check saved count
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
    <>
      {/* Top Navigation Bar */}
      <header className="site-header">
        <div className="header-inner">
          <div className="brand-logo">
            <span className="brand-icon">🔮</span>
            <span className="brand-name">
              Decider<span className="brand-accent">Wheel</span>
            </span>
          </div>

          <div className="header-actions">
            <button
              type="button"
              onClick={() => setSetupOpen(true)}
              className={`status-pill ${supabaseConfigured ? "status-pill-live" : "status-pill-fallback"}`}
              title="Click to view Database Settings & SQL schema"
            >
              <span className="status-dot" />
              <span>{supabaseConfigured ? "Supabase Live" : "Local Storage"}</span>
            </button>

            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="btn-header-history"
              title="View your created decisions"
            >
              <span>📜 History</span>
              {historyCount > 0 && (
                <span className="history-counter-pill">{historyCount}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Hero Header */}
        <section className="hero-section">
          <div className="hero-badge animate-fade-in">
            <span className="sparkle-emoji">✨</span>
            <span>Zero-Spoiler Random Decider</span>
          </div>

          <h1 className="hero-title animate-fade-in">
            Let the Wheel Decide. <br />
            <span className="text-gradient-mystery">Keep the Mystery Intact.</span>
          </h1>

          <p className="hero-subtitle animate-fade-in">
            Enter your choices and send the link to a friend. The wheel segments remain
            anonymous <span className="mystery-highlight">(?)</span> until spun — then all options
            reveal with the winning choice locked forever!
          </p>

          <div className="feature-pills-row animate-fade-in">
            <div className="feature-pill">
              <span>🎭</span>
              <span>Anonymous Slices</span>
            </div>
            <div className="feature-pill">
              <span>🔒</span>
              <span>One Spin Only</span>
            </div>
            <div className="feature-pill">
              <span>👑</span>
              <span>Live Creator Tracking</span>
            </div>
            <div className="feature-pill">
              <span>💬</span>
              <span>WhatsApp Ready</span>
            </div>
          </div>
        </section>

        {/* Creator Form Section */}
        <section className="creator-section">
          <CreateDecisionForm />
        </section>

        {/* How It Works Showcase */}
        <section className="how-it-works-section">
          <h2 className="section-heading">How Decider Wheel Works</h2>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-num-circle">1</div>
              <h3 className="step-title">Craft Your Dilemma</h3>
              <p className="step-desc">
                Give your decision a title and add 2 to 12 hidden choices. Presets make it effortless.
              </p>
            </div>

            <div className="step-card">
              <div className="step-num-circle">2</div>
              <h3 className="step-title">Send to WhatsApp</h3>
              <p className="step-desc">
                Share your unique link. The options are stored securely on the server and completely hidden from the wheel preview.
              </p>
            </div>

            <div className="step-card">
              <div className="step-num-circle">3</div>
              <h3 className="step-title">Friend Spins & Reveals</h3>
              <p className="step-desc">
                Your friend taps Spin. The server picks the winner, the mystery slices morph open, and the result is locked permanently!
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <p>© 2026 Decider Wheel • Mobile-First Anonymous Decider</p>
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
    </>
  );
}
