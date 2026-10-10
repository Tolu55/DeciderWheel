"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import { ClientDecision, SpinResult } from "@/lib/types";
import { MysteryWheel } from "./MysteryWheel";

interface DecisionClientViewProps {
  initialDecision: ClientDecision;
  isCreatorParam?: boolean;
}

export const DecisionClientView: React.FC<DecisionClientViewProps> = ({
  initialDecision,
  isCreatorParam = false,
}) => {
  const [decision, setDecision] = useState<ClientDecision>(initialDecision);
  const [isCreator, setIsCreator] = useState(isCreatorParam || Boolean(initialDecision.isCreator));
  const [copyToast, setCopyToast] = useState(false);
  const [formattedSpunDate, setFormattedSpunDate] = useState<string>("");
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (decision.spun_at) {
      setFormattedSpunDate(
        new Date(decision.spun_at).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }
  }, [decision.spun_at]);

  // Check localStorage for creator token if not already verified
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem(`decider_token_${decision.id}`);
      if (storedToken) {
        setIsCreator(true);
      }
    }
  }, [decision.id]);

  // If creator and wheel has not spun yet, live-poll for when friend spins
  useEffect(() => {
    if (decision.spun) return; // already finished

    const pollInterval = setInterval(async () => {
      try {
        const storedToken = typeof window !== "undefined" ? localStorage.getItem(`decider_token_${decision.id}`) : null;
        const url = `/api/decisions/${decision.id}${storedToken ? `?token=${storedToken}` : ""}`;
        const res = await fetch(url);
        if (res.ok) {
          const updated: ClientDecision = await res.json();
          if (updated.spun) {
            startTransition(() => {
              setDecision(updated);
            });
          }
        }
      } catch {
        // network retry
      }
    }, 3500);

    return () => clearInterval(pollInterval);
  }, [decision.id, decision.spun]);

  // Spin Request Handler
  const handleSpinRequest = useCallback(async (): Promise<{
    winner_index: number;
    winner_choice: string;
    options: string[];
  } | null> => {
    try {
      const res = await fetch(`/api/decisions/${decision.id}/spin`, {
        method: "POST",
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to spin.");
        return null;
      }

      const result: SpinResult = await res.json();

      // Update state
      setDecision((prev) => ({
        ...prev,
        spun: true,
        spun_at: result.spun_at,
        winner_index: result.winner_index,
        winner_choice: result.winner_choice,
        options: result.options,
        optionCount: result.options.length,
      }));

      return {
        winner_index: result.winner_index,
        winner_choice: result.winner_choice,
        options: result.options,
      };
    } catch (err) {
      console.error("Spin error:", err);
      alert("Network error while spinning.");
      return null;
    }
  }, [decision.id]);

  // Share handlers
  const getShareUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/d/${decision.id}`;
    }
    return `/d/${decision.id}`;
  };

  const getShareText = () => {
    return `🔮 Help me decide: "${decision.title}"!\nSpin the anonymous Mystery Wheel to reveal our fate: ${getShareUrl()}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareUrl());
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(getShareText());
    const waUrl = `https://api.whatsapp.com/send?text=${text}`;
    window.open(waUrl, "_blank");
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `🔮 ${decision.title}`,
          text: getShareText(),
          url: getShareUrl(),
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="decision-page-container">
      {/* Toast Notification */}
      {copyToast && (
        <div className="toast-notification animate-bounce-in" role="alert">
          <span>✓ Share link copied to clipboard!</span>
        </div>
      )}

      {/* Creator Banner */}
      {isCreator && (
        <div className="creator-banner animate-fade-in">
          <div className="creator-banner-left">
            <span className="creator-badge-icon">👑</span>
            <div>
              <p className="creator-banner-title">Creator Mode</p>
              <p className="creator-banner-desc">
                {decision.spun
                  ? "Your friend has spun the wheel! Check the winning outcome below."
                  : "Waiting for your friend to open the link and spin the wheel..."}
              </p>
            </div>
          </div>
          {!decision.spun && (
            <div className="live-poll-indicator" title="Live checking for spins">
              <span className="pulsing-radar-dot" />
              <span>Listening Live</span>
            </div>
          )}
        </div>
      )}

      {/* Header Info */}
      <div className="decision-header-card">
        <div className="decision-tag-row">
          <span className="badge-tag mystery-tag">
            🔮 Mystery Decider
          </span>
          <span className="badge-tag count-tag">
            {decision.optionCount} Hidden Choices
          </span>
          {decision.spun && (
            <span className="badge-tag locked-tag">
              🔒 Locked
            </span>
          )}
        </div>

        <h1 className="decision-title-main">{decision.title}</h1>

        <p className="decision-instructions">
          {!decision.spun ? (
            <span>
              Options remain <strong>anonymous</strong> on the wheel until spun. Tap the button below to discover your fate!
            </span>
          ) : (
            <span>
              This decision is final.{formattedSpunDate ? ` Spun on ${formattedSpunDate}.` : ""}
            </span>
          )}
        </p>
      </div>

      {/* Mobile-optimized Action Bar for WhatsApp / Sharing */}
      <div className="share-bar-container">
        <button
          type="button"
          onClick={handleWhatsAppShare}
          className="btn-share-whatsapp"
          aria-label="Share via WhatsApp"
        >
          <span className="wa-icon">💬</span>
          <span>Share via WhatsApp</span>
        </button>

        <button
          type="button"
          onClick={handleNativeShare}
          className="btn-share-native"
          aria-label="Share Link"
        >
          <span>🔗</span>
          <span>Share / Copy</span>
        </button>
      </div>

      {/* The Mystery Wheel */}
      <div className="wheel-centerpiece">
        <MysteryWheel
          optionCount={decision.optionCount}
          options={decision.options}
          winnerIndex={decision.winner_index}
          winnerChoice={decision.winner_choice}
          isSpun={decision.spun}
          onSpinRequest={decision.spun ? undefined : handleSpinRequest}
        />
      </div>

      {/* Mystery Guarantee Notice (BEFORE SPIN) */}
      {!decision.spun && (
        <div className="mystery-lock-info-card animate-fade-in">
          <div className="flex-center gap-2 mb-1">
            <span className="mystery-lock-icon">🔒</span>
            <span className="font-bold text-white text-sm">Mystery Mode Active</span>
          </div>
          <p className="text-xs text-secondary text-center">
            All {decision.optionCount} choices are locked on the server. Slices remain anonymous (?) until the wheel is spun!
          </p>
        </div>
      )}

      {/* Revealed Options Breakdown Card (ONLY AFTER SPIN) */}
      {decision.spun && decision.options && decision.options.length > 0 && (
        <div className="revealed-options-card animate-fade-in">
          <div className="revealed-header">
            <h2 className="revealed-title">Revealed Choices</h2>
            <span className="revealed-subtitle">
              The curtain has been lifted! Here were all the options:
            </span>
          </div>

          <div className="revealed-grid">
            {decision.options.map((opt, idx) => {
              const isWinner = decision.winner_index === idx;
              return (
                <div
                  key={idx}
                  className={`revealed-option-item ${isWinner ? "is-winner-item" : ""}`}
                >
                  <div className="option-item-left">
                    <span className="option-num-badge">#{idx + 1}</span>
                    <span className="option-item-text">{opt}</span>
                  </div>
                  {isWinner && (
                    <span className="winner-chip">
                      ★ WINNER
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="decision-footer-nav">
        <Link href="/" className="btn-create-new">
          <span>🎡</span>
          <span>Create a New Mystery Wheel</span>
        </Link>
      </div>
    </div>
  );
};
