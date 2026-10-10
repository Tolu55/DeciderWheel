"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const PRESETS = [
  {
    name: "🍽️ Dinner Decider",
    title: "Where should we grab dinner tonight?",
    options: ["Wood-fired Pizza", "Artisan Burgers", "Tokyo Sushi", "Street Tacos", "Thai Curry"],
  },
  {
    name: "🎬 Movie Night",
    title: "What genre are we streaming tonight?",
    options: ["Sci-Fi Thriller", "Feel-good Comedy", "Psychological Horror", "Action Blockbuster"],
  },
  {
    name: "⚖️ Dilemma",
    title: "Should we go out or stay in?",
    options: ["Go Out & Celebrate 🎉", "Stay In & Cozy Up ☕"],
  },
  {
    name: "🎮 Game / Activity",
    title: "What are we playing next?",
    options: ["Board Games", "Video Games", "Card Game", "Trivia Night"],
  },
];

export const CreateDecisionForm: React.FC = () => {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle option changes
  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
    if (error) setError(null);
  };

  // Add an option input
  const handleAddOption = () => {
    if (options.length >= 12) return;
    setOptions([...options, ""]);
  };

  // Remove option input
  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
  };

  // Apply a preset
  const applyPreset = (preset: (typeof PRESETS)[0]) => {
    setTitle(preset.title);
    setOptions([...preset.options]);
    setError(null);
  };

  // Check for duplicate choices
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
      setError("Please ensure all choices are distinct (no duplicates).");
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

      // Save to creator's local history
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

        // Also save current creator token for this decision ID
        localStorage.setItem(`decider_token_${data.id}`, data.creator_token);
      }

      // Navigate to the created decision page with creator query param
      router.push(`/d/${data.id}?creator=true`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="card-glass-form">
      {/* Quick Presets Bar */}
      <div className="presets-container">
        <span className="presets-label">⚡ Quick Presets:</span>
        <div className="presets-chips">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(p)}
              className="preset-chip"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="decision-form">
        {/* Title Input */}
        <div className="form-group">
          <label htmlFor="decision-title" className="form-label">
            <span>Decision Title</span>
            <span className="label-counter">{title.length}/120</span>
          </label>
          <input
            id="decision-title"
            type="text"
            placeholder="e.g. What should we do this Friday night?"
            value={title}
            maxLength={120}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
            className="input-field input-title"
            required
            autoComplete="off"
          />
        </div>

        {/* Options List */}
        <div className="form-group">
          <div className="options-header">
            <label className="form-label">
              <span>Hidden Choices</span>
              <span className="text-secondary text-sm">
                (2 to 12 choices • Hidden from friends until they spin)
              </span>
            </label>
            <span className="label-badge">{filledOptions.length}/12</span>
          </div>

          <div className="options-list">
            {options.map((opt, index) => (
              <div key={index} className="option-row">
                <div className="option-index-badge">
                  <span>#{index + 1}</span>
                </div>
                <input
                  type="text"
                  placeholder={`Choice #${index + 1}`}
                  value={opt}
                  maxLength={60}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="input-field input-option"
                  autoComplete="off"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="btn-icon-remove"
                    title="Remove choice"
                    aria-label={`Remove choice ${index + 1}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Option Button */}
          {options.length < 12 && (
            <button
              type="button"
              onClick={handleAddOption}
              className="btn-add-option"
            >
              <span className="plus-icon">＋</span>
              <span>Add Another Choice ({options.length}/12)</span>
            </button>
          )}
        </div>

        {/* Error Notice */}
        {error && (
          <div className="error-alert animate-shake" role="alert">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Warning if duplicates found */}
        {hasDuplicates && (
          <div className="warning-alert" role="alert">
            <span>⚠️ Two or more choices are identical. Please make them unique.</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || filledOptions.length < 2 || hasDuplicates}
          className="btn-submit-glow"
        >
          {loading ? (
            <span className="flex-center gap-2">
              <span className="spinner-dot" />
              Crafting Mystery Wheel...
            </span>
          ) : (
            <span className="flex-center gap-2">
              <span className="sparkle-icon">🔮</span>
              <span>GENERATE MYSTERY WHEEL LINK</span>
            </span>
          )}
        </button>

        <p className="privacy-hint">
          🔒 <strong>Zero Spoiler Guarantee:</strong> Choices stay anonymous on the wheel. Your friend only sees mystery segments until they spin!
        </p>
      </form>
    </div>
  );
};
