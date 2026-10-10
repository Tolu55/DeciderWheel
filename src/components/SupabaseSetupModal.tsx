"use client";

import React, { useState } from "react";

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConfigured: boolean;
}

const SQL_SCHEMA = `-- 1. Create the decisions table
CREATE TABLE IF NOT EXISTS public.decisions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  options JSONB NOT NULL,
  creator_token TEXT NOT NULL,
  spun BOOLEAN NOT NULL DEFAULT FALSE,
  spun_at TIMESTAMPTZ,
  winner_index INTEGER,
  winner_choice TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_decisions_created_at ON public.decisions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_spun ON public.decisions (spun);

-- 3. Row Level Security (RLS)
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read decisions"
  ON public.decisions FOR SELECT USING (true);

CREATE POLICY "Public insert decisions"
  ON public.decisions FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow spin updates"
  ON public.decisions FOR UPDATE USING (true) WITH CHECK (true);
`;

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({
  isOpen,
  onClose,
  isConfigured,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <h2 className="modal-title">Supabase Database Setup</h2>
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
          {/* Status Banner */}
          <div className={`status-callout ${isConfigured ? "status-live" : "status-fallback"}`}>
            <span className="status-callout-icon">{isConfigured ? "🟢" : "🟡"}</span>
            <div>
              <p className="font-semibold text-white">
                {isConfigured
                  ? "Supabase Connected & Active"
                  : "Running in Zero-Config Local Mode"}
              </p>
              <p className="text-sm opacity-85">
                {isConfigured
                  ? "All decisions and spins are persisted directly in your Supabase Postgres database."
                  : "The app is working immediately with persistent in-memory storage! To persist across cloud restarts and deployments, connect your free Supabase database below."}
              </p>
            </div>
          </div>

          {/* Quick Steps */}
          <div className="setup-steps">
            <h3 className="setup-steps-title">Connect in 2 Minutes:</h3>
            <ol className="steps-list">
              <li>
                <strong>Create a free project</strong> at{" "}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="link-highlight"
                >
                  supabase.com
                </a>
              </li>
              <li>
                <strong>Run this SQL script</strong> in your Supabase{" "}
                <em>SQL Editor</em>:
              </li>
            </ol>
          </div>

          {/* SQL Block */}
          <div className="sql-box-wrapper">
            <div className="sql-box-header">
              <span className="sql-box-title">supabase/schema.sql</span>
              <button
                type="button"
                onClick={handleCopySql}
                className="btn-copy-code"
              >
                {copied ? "✓ Copied!" : "📋 Copy SQL"}
              </button>
            </div>
            <pre className="sql-code-block">
              <code>{SQL_SCHEMA}</code>
            </pre>
          </div>

          <div className="env-instructions">
            <h4 className="text-sm font-semibold text-white mb-1">
              Add to your <code>.env.local</code>:
            </h4>
            <div className="code-snippet">
              NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-ID].supabase.co
              <br />
              NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-secondary">
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
