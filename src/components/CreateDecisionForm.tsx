"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FLAT_SLICE_COLORS } from "./MysteryWheel";

const PRESETS = [
  {
    name: "🍽️ Dinner Decider",
    title: "Where should we eat on Friday?",
    options: ["Zebra Pizza", "Jollof Palace", "Suya Spot"],
  },
  {
    name: "🎬 Movie Night",
    title: "What movie genre tonight?",
    options: ["Sci-Fi Thriller", "Comedy", "Horror", "Action"],
  },
  {
    name: "⚖️ Dilemma",
    title: "Should we go out or stay in?",
    options: ["Go Out & Celebrate", "Stay In & Cozy Up"],
  },
  {
    name: "🎮 Activity",
    title: "What are we doing next?",
    options: ["Board Games", "Video Games", "Card Game", "Trivia"],
  },
];

export const CreateDecisionForm: React.FC = () => {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
    if (error) setError(null);
  };

  const handleAddOption = () => {
    if (options.length >= 12) return;
    setOptions([...options, ""]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
  };

  const applyPreset = (preset: (typeof PRESETS)[0]) => {
    setTitle(preset.title);
    setOptions([...preset.options]);
    setError(null);
  };

  const filledOptions = options.map((o) => o.trim()).filter(Boolean);
  const hasDuplicates = new Set(filledOptions.map((o) => o.toLowerCase())).size < filledOptions.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError("Please provide a title for your decision.");
      return;
    }

    if (filledOptions.length < 2) {
      setError("Please provide at least 2 distinct choices.");
      return;
    }

    if (filledOptions.length > 12) {
      setError("Maximum 12 choices allowed.");
      return;
    }

    if (hasDuplicates) {
      setError("Please ensure choices are unique (no duplicates).");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanTitle,
          options: filledOptions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create decision.");
      }

      if (typeof window !== "undefined") {
        const historyKey = "decider_wheel_creator_history";
        const savedHistory = JSON.parse(localStorage.getItem(historyKey) || "[]");
        savedHistory.unshift({
          id: data.id,
          title: cleanTitle,
          creator_token: data.creator_token,
          optionCount: filledOptions.length,
          created_at: new Date().toISOString(),
          spun: false,
        });
        localStorage.setItem(historyKey, JSON.stringify(savedHistory.slice(0, 30)));
        localStorage.setItem(`decider_token_${data.id}`, data.creator_token);
      }

      router.push(`/d/${data.id}?creator=true`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="share-white-card create-card">
      {/* Presets Row */}
      <div className="presets-row">
        <span className="presets-tag">Quick Presets:</span>
        <div className="presets-scroll">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(p)}
              className="btn-preset-flat"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form-stack">
        {/* Title Input */}
        <div className="field-group">
          <label htmlFor="create-title" className="field-label">
            Question / Decision Title
          </label>
          <input
            id="create-title"
            type="text"
            placeholder="e.g. Where should we eat on Friday?"
            value={title}
            maxLength={120}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
            className="input-flat"
            required
            autoComplete="off"
          />
        </div>

        {/* Options List */}
        <div className="field-group">
          <label className="field-label">
            Choices ({filledOptions.length}/12)
          </label>
          <div className="options-stack">
            {options.map((opt, index) => (
              <div key={index} className="option-input-row">
                <span
                  className="choice-color-dot"
                  style={{
                    backgroundColor:
                      FLAT_SLICE_COLORS[index % FLAT_SLICE_COLORS.length],
                  }}
                />
                <input
                  type="text"
                  placeholder={`Choice #${index + 1}`}
                  value={opt}
                  maxLength={60}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="input-flat flex-1"
                  autoComplete="off"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="btn-remove-circle"
                    title="Remove choice"
                    aria-label={`Remove choice ${index + 1}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {options.length < 12 && (
            <button
              type="button"
              onClick={handleAddOption}
              className="btn-add-choice-flat"
            >
              ＋ Add another choice
            </button>
          )}
        </div>

        {error && <div className="alert-box-error">{error}</div>}

        {hasDuplicates && (
          <div className="alert-box-warning">
            Two or more choices are identical. Please make them unique.
          </div>
        )}

        {/* Big Yellow Create Button (No gradients) */}
        <button
          type="submit"
          disabled={loading || filledOptions.length < 2 || hasDuplicates}
          className="btn-create-submit"
        >
          {loading ? "Creating Spin..." : "Create Mystery Spin"}
        </button>

        <p className="create-footer-hint">
          🔒 Choices stay hidden until spun. Friends see anonymous slices!
        </p>
      </form>
    </div>
  );
};
