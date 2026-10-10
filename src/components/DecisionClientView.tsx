"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import { ClientDecision, SpinResult } from "@/lib/types";
import { MysteryWheel, FLAT_SLICE_COLORS } from "./MysteryWheel";

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
  const [creatorWantSpin, setCreatorWantSpin] = useState(false);
  const [, startTransition] = useTransition();

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
    if (decision.spun) return;

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
    }, 3000);

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

  // Clean Share URL (without creator parameter)
  const getShareUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/d/${decision.id}`;
    }
    return `/d/${decision.id}`;
  };

  const getShareText = () => {
    return `🔮 Help me decide: "${decision.title}"!\nSpin the mystery wheel to choose our fate: ${getShareUrl()}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareUrl());
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2200);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(getShareText());
    const waUrl = `https://api.whatsapp.com/send?text=${text}`;
    window.open(waUrl, "_blank");
  };

  return (
    <div className="mobile-shell">
      {/* Toast Notification */}
      {copyToast && (
        <div className="toast-pill" role="alert">
          ✓ Copied link to clipboard!
        </div>
      )}

      {/* Brand Header */}
      <div className="top-brand-row">
        <Link href="/" className="brand-link">
          <span className="brand-wheel-circle">
            <span className="dot-slice d1" />
            <span className="dot-slice d2" />
            <span className="dot-slice d3" />
            <span className="dot-slice d4" />
          </span>
          <span className="brand-text">Mystery Spin</span>
        </Link>
      </div>

      {/* Main Question Title */}
      <h1 className="question-title">{decision.title}</h1>

      {/* ================================================================= */}
      {/* CASE 1: UNSPUN CREATOR VIEW (Matches Reference Image 3)           */}
      {/* ================================================================= */}
      {isCreator && !decision.spun && !creatorWantSpin ? (
        <div className="creator-flow-container">
          {/* Waiting Pill */}
          <div className="waiting-pill">
            <span className="status-yellow-dot" />
            <span>Waiting for your friend to spin</span>
          </div>

          {/* White Card: Send link to your friend */}
          <div className="share-white-card">
            <h2 className="share-card-title">Send this link to your friend</h2>
            <p className="share-card-sub">
              They see the title and a wheel. The choices stay hidden until they spin.
            </p>

            <div className="share-input-wrapper">
              <input
                type="text"
                readOnly
                value={getShareUrl()}
                className="share-link-input"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
            </div>

            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="btn-whatsapp-flat"
            >
              Send on WhatsApp
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="btn-copy-flat"
            >
              Copy link
            </button>

            <div className="share-card-footer">
              <span className="footer-dim-text">Check the result from another device</span>
            </div>
          </div>

          {/* Creator Choices Section (if available) */}
          {decision.options && decision.options.length > 0 && (
            <div className="choices-list-section">
              <h3 className="choices-section-title">Your choices</h3>
              <div className="choices-stack">
                {decision.options.map((opt, idx) => (
                  <div key={idx} className="choice-pill-item">
                    <span
                      className="choice-color-dot"
                      style={{
                        backgroundColor:
                          FLAT_SLICE_COLORS[idx % FLAT_SLICE_COLORS.length],
                      }}
                    />
                    <span className="choice-pill-text">{opt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Option for creator to spin it themselves */}
          <div className="creator-self-spin-section">
            <button
              type="button"
              onClick={() => setCreatorWantSpin(true)}
              className="link-self-spin"
            >
              Spin it yourself instead
            </button>
            <p className="self-spin-sub">
              There&apos;s only one spin. If you use it, your friend sees the same result.
            </p>

            <Link href="/" className="btn-make-another">
              Make another spin
            </Link>
          </div>
        </div>
      ) : (
        /* ================================================================= */
        /* CASE 2: WHEEL VIEW (Friend Unspun OR Spun Result)                */
        /* ================================================================= */
        <div className="wheel-flow-container">
          {/* Subtitle if unspun (Matches Reference Image 4) */}
          {!decision.spun && (
            <p className="unspun-subtitle">
              {decision.optionCount} choices are hidden. Spin to see which one gets picked.
            </p>
          )}

          {/* The Flat Mystery Wheel */}
          <div className="wheel-center-wrap">
            <MysteryWheel
              optionCount={decision.optionCount}
              options={decision.options}
              winnerIndex={decision.winner_index}
              winnerChoice={decision.winner_choice}
              isSpun={decision.spun}
              onSpinRequest={decision.spun ? undefined : handleSpinRequest}
            />
          </div>

          {/* =============================================================== */}
          {/* SPUN OUTCOME SECTION (Matches Reference Images 1 & 2)           */}
          {/* =============================================================== */}
          {decision.spun && decision.winner_choice && (
            <div className="result-announcement-section">
              <div className="result-header">
                <span className="result-label">The wheel picked</span>
                <h2 className="result-winner-text">{decision.winner_choice}</h2>
                <span className="result-time-text">Spun just now</span>
              </div>

              {/* All the choices list */}
              {decision.options && decision.options.length > 0 && (
                <div className="choices-list-section">
                  <h3 className="choices-section-title">All the choices</h3>
                  <div className="choices-stack">
                    {decision.options.map((opt, idx) => {
                      const isPicked = decision.winner_index === idx;
                      return (
                        <div
                          key={idx}
                          className={`choice-pill-item ${isPicked ? "is-picked-pill" : ""}`}
                        >
                          <div className="choice-pill-left">
                            <span
                              className="choice-color-dot"
                              style={{
                                backgroundColor: isPicked
                                  ? "#111111"
                                  : FLAT_SLICE_COLORS[idx % FLAT_SLICE_COLORS.length],
                              }}
                            />
                            <span className="choice-pill-text">{opt}</span>
                          </div>

                          {isPicked && (
                            <span className="picked-badge">Picked</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Bottom Make Your Own Spin Button */}
              <div className="make-own-spin-container">
                <Link href="/" className="btn-make-own-spin">
                  Make your own spin
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
