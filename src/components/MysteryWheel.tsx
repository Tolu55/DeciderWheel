"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import confetti from "canvas-confetti";
import { sounds } from "@/lib/sound";

interface MysteryWheelProps {
  optionCount: number;
  options?: string[]; // Defined only if revealed
  winnerIndex?: number | null;
  winnerChoice?: string | null;
  isSpun: boolean;
  onSpinRequest?: () => Promise<{ winner_index: number; winner_choice: string; options: string[] } | null>;
  disabled?: boolean;
}

// Curated high-contrast mystery jewel palette
const SLICE_PALETTE = [
  { bg: "#7c3aed", accent: "#a78bfa", dark: "#5b21b6", border: "#c4b5fd" }, // Royal Violet
  { bg: "#06b6d4", accent: "#38bdf8", dark: "#0891b2", border: "#67e8f9" }, // Electric Cyan
  { bg: "#f43f5e", accent: "#fb7185", dark: "#e11d48", border: "#fda4af" }, // Hot Coral Pink
  { bg: "#f59e0b", accent: "#fbbf24", dark: "#d97706", border: "#fde68a" }, // Sunset Gold
  { bg: "#10b981", accent: "#34d399", dark: "#059669", border: "#6ee7b7" }, // Emerald Neon
  { bg: "#6366f1", accent: "#818cf8", dark: "#4f46e5", border: "#a5b4fc" }, // Cosmic Indigo
  { bg: "#f97316", accent: "#fb923c", dark: "#ea580c", border: "#fed7aa" }, // Flame Orange
  { bg: "#3b82f6", accent: "#60a5fa", dark: "#2563eb", border: "#93c5fd" }, // Deep Sapphire
  { bg: "#ec4899", accent: "#f472b6", dark: "#db2777", border: "#fbcfe8" }, // Neon Fuchsia
  { bg: "#14b8a6", accent: "#2dd4bf", dark: "#0d9488", border: "#99f6e4" }, // Mystic Teal
  { bg: "#8b5cf6", accent: "#c084fc", dark: "#7c3aed", border: "#ddd6fe" }, // Dark Orchid
  { bg: "#84cc16", accent: "#a3e635", dark: "#65a30d", border: "#bef264" }, // Cyber Lime
];

export const MysteryWheel: React.FC<MysteryWheelProps> = ({
  optionCount,
  options,
  winnerIndex,
  winnerChoice,
  isSpun,
  onSpinRequest,
  disabled = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isSpinning, setIsSpinning] = useState(false);
  const [currentOptions, setCurrentOptions] = useState<string[] | undefined>(
    isSpun ? options : undefined
  );
  const [revealedWinner, setRevealedWinner] = useState<{ index: number; choice: string } | null>(
    isSpun && winnerIndex !== null && winnerIndex !== undefined && winnerChoice
      ? { index: winnerIndex, choice: winnerChoice }
      : null
  );
  const [soundMuted, setSoundMuted] = useState(false);

  // Wheel state refs
  const rotationRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const lastPegCrossedRef = useRef<number>(-1);
  const pointerDeflectionRef = useRef<number>(0);

  // ONLY sync options if ALREADY SPUN or REVEALED
  useEffect(() => {
    if (isSpun && options && options.length > 0) {
      setCurrentOptions(options);
    }
  }, [isSpun, options]);

  useEffect(() => {
    setSoundMuted(sounds.isMuted());
  }, []);

  const toggleSound = () => {
    const nextMute = !soundMuted;
    sounds.setMuted(nextMute);
    setSoundMuted(nextMute);
  };

  const totalSlices = Math.max(2, currentOptions ? currentOptions.length : optionCount);
  const sliceAngle = (2 * Math.PI) / totalSlices;

  // STRICT REVEAL CHECK: Options are NEVER shown until wheel is spun!
  const isRevealed = Boolean(isSpun || revealedWinner !== null);

  // Draw the high-end Mystery Wheel
  const drawWheel = useCallback(
    (rotation: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const size = canvas.width;
      const center = size / 2;
      const outerBezelRadius = center - 8;
      const bezelWidth = 26;
      const sliceRadius = outerBezelRadius - bezelWidth;

      ctx.clearRect(0, 0, size, size);

      // ==========================================
      // 1. OUTER CHROME & GLOW BEZEL
      // ==========================================
      // Bezel base
      ctx.beginPath();
      ctx.arc(center, center, outerBezelRadius, 0, Math.PI * 2);
      const bezelGrad = ctx.createRadialGradient(
        center,
        center,
        sliceRadius,
        center,
        center,
        outerBezelRadius
      );
      bezelGrad.addColorStop(0, "#1e1b4b");
      bezelGrad.addColorStop(0.5, "#0f172a");
      bezelGrad.addColorStop(0.85, "#2e1065");
      bezelGrad.addColorStop(1, "#090913");
      ctx.fillStyle = bezelGrad;
      ctx.shadowColor = "rgba(168, 85, 247, 0.4)";
      ctx.shadowBlur = 25;
      ctx.fill();

      // Outer golden metallic rim
      ctx.beginPath();
      ctx.arc(center, center, outerBezelRadius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(251, 191, 36, 0.45)";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Inner rim divider
      ctx.beginPath();
      ctx.arc(center, center, sliceRadius + 1, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Perimeter LED Bulbs (Arcade marquee lights)
      const totalBulbs = Math.max(16, totalSlices * 2);
      const bulbRadius = outerBezelRadius - bezelWidth / 2;
      for (let b = 0; b < totalBulbs; b++) {
        const bAngle = (b / totalBulbs) * Math.PI * 2 + (isSpinning ? rotation * 0.4 : 0);
        const bx = center + Math.cos(bAngle) * bulbRadius;
        const by = center + Math.sin(bAngle) * bulbRadius;

        ctx.beginPath();
        ctx.arc(bx, by, 3.8, 0, Math.PI * 2);
        const isGoldBulb = b % 2 === 0;
        ctx.fillStyle = isGoldBulb ? "#fde047" : "#38bdf8";
        ctx.shadowColor = isGoldBulb ? "rgba(253, 224, 71, 0.9)" : "rgba(56, 189, 248, 0.9)";
        ctx.shadowBlur = 8;
        ctx.fill();

        // Bulb glass specular
        ctx.beginPath();
        ctx.arc(bx - 1, by - 1, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      }

      // ==========================================
      // 2. ROTATING SLICE SEGMENTS
      // ==========================================
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(rotation);

      for (let i = 0; i < totalSlices; i++) {
        const startAngle = i * sliceAngle;
        const endAngle = startAngle + sliceAngle;
        const color = SLICE_PALETTE[i % SLICE_PALETTE.length];
        const isWinnerSlice = isRevealed && revealedWinner !== null && revealedWinner.index === i;

        // Slice wedge path
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, sliceRadius, startAngle, endAngle);
        ctx.closePath();

        // Fill wedge with 3D gradient
        const grad = ctx.createRadialGradient(0, 0, 15, 0, 0, sliceRadius);
        if (isWinnerSlice) {
          grad.addColorStop(0, "#fde68a");
          grad.addColorStop(0.35, "#f59e0b");
          grad.addColorStop(1, "#b45309");
        } else {
          grad.addColorStop(0, color.accent);
          grad.addColorStop(0.5, color.bg);
          grad.addColorStop(1, color.dark);
        }
        ctx.fillStyle = grad;
        ctx.shadowBlur = 0;
        ctx.fill();

        // Slice border divider
        ctx.strokeStyle = isWinnerSlice ? "rgba(255, 255, 255, 0.85)" : "rgba(255, 255, 255, 0.35)";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // ==========================================
        // 3. SLICE CONTENT: MYSTERY vs REVEALED
        // ==========================================
        ctx.save();
        ctx.rotate(startAngle + sliceAngle / 2);

        if (!isRevealed) {
          // ----------------------------------------
          // MYSTERY MODE: Anonymous '?' Glowing Token
          // ----------------------------------------
          const tokenDist = sliceRadius * 0.62;
          const tokenR = Math.max(20, Math.min(27, (sliceAngle * tokenDist) / 2.3));

          // Circular Mystic Token Base
          ctx.beginPath();
          ctx.arc(tokenDist, 0, tokenR, 0, Math.PI * 2);
          const tokenGrad = ctx.createRadialGradient(tokenDist, 0, 2, tokenDist, 0, tokenR);
          tokenGrad.addColorStop(0, "rgba(255, 255, 255, 0.25)");
          tokenGrad.addColorStop(0.85, "rgba(15, 23, 42, 0.85)");
          tokenGrad.addColorStop(1, "rgba(5, 5, 20, 0.95)");
          ctx.fillStyle = tokenGrad;
          ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
          ctx.shadowBlur = 8;
          ctx.fill();

          // Token golden/neon border
          ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
          ctx.lineWidth = 2;
          ctx.stroke();

          // Glowing '?' Glyph
          const qSize = Math.round(tokenR * 1.3);
          ctx.font = `bold ${qSize}px system-ui, -apple-system, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "rgba(255, 255, 255, 0.9)";
          ctx.shadowBlur = 10;
          ctx.fillText("?", tokenDist, 1);

          // Outer perimeter mystery label
          ctx.font = "bold 11px system-ui, sans-serif";
          ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
          ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
          ctx.shadowBlur = 3;
          ctx.fillText(`MYSTERY #${i + 1}`, sliceRadius - 38, 0);
        } else {
          // ----------------------------------------
          // REVEALED MODE: Clear, Readable Option Name
          // ----------------------------------------
          const rawText = currentOptions && currentOptions[i] ? currentOptions[i] : `Choice #${i + 1}`;
          const isWinner = isWinnerSlice;

          // Compute readable font size
          const fontSize = totalSlices <= 4 ? 20 : totalSlices <= 7 ? 16 : 13;
          ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;

          // Truncate cleanly if string is too long for wedge
          const maxChars = totalSlices <= 4 ? 20 : 15;
          const labelText = rawText.length > maxChars ? rawText.substring(0, maxChars - 1) + "…" : rawText;

          // Draw contrasting pill background for readability
          const textMetrics = ctx.measureText(labelText);
          const pillW = Math.min(sliceRadius * 0.65, textMetrics.width + 26);
          const pillH = fontSize + 16;
          const pillX = sliceRadius * 0.58;

          ctx.beginPath();
          const r = pillH / 2;
          ctx.roundRect(pillX - pillW / 2, -pillH / 2, pillW, pillH, r);

          if (isWinner) {
            ctx.fillStyle = "#ffffff";
            ctx.shadowColor = "rgba(251, 191, 36, 0.9)";
            ctx.shadowBlur = 15;
            ctx.fill();
            ctx.strokeStyle = "#fbbf24";
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Winner text
            ctx.fillStyle = "#1e1b4b";
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`★ ${labelText}`, pillX, 0);
          } else {
            ctx.fillStyle = "rgba(10, 15, 35, 0.78)";
            ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Regular option text
            ctx.fillStyle = "#ffffff";
            ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
            ctx.shadowBlur = 4;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(labelText, pillX, 0);
          }
        }

        ctx.restore();
      }

      // Perimeter 3D Pegs (Silver rivets at each slice seam)
      for (let i = 0; i < totalSlices; i++) {
        const pegAngle = i * sliceAngle;
        const px = Math.cos(pegAngle) * (sliceRadius - 3);
        const py = Math.sin(pegAngle) * (sliceRadius - 3);

        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#cbd5e1";
        ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
        ctx.shadowBlur = 4;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px - 1, py - 1, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      }

      ctx.restore(); // Restore center translate & rotate

      // ==========================================
      // 4. CENTER SPINDLE / METALLIC HUB
      // ==========================================
      ctx.save();
      // Outer hub bezel
      ctx.beginPath();
      ctx.arc(center, center, 44, 0, Math.PI * 2);
      const hubOuterGrad = ctx.createRadialGradient(center, center, 10, center, center, 44);
      hubOuterGrad.addColorStop(0, "#334155");
      hubOuterGrad.addColorStop(0.65, "#0f172a");
      hubOuterGrad.addColorStop(1, "#020617");
      ctx.fillStyle = hubOuterGrad;
      ctx.shadowColor = "rgba(147, 51, 234, 0.65)";
      ctx.shadowBlur = 18;
      ctx.fill();

      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Inner jewel core
      ctx.beginPath();
      ctx.arc(center, center, 28, 0, Math.PI * 2);
      const coreGrad = ctx.createRadialGradient(center, center, 2, center, center, 28);
      coreGrad.addColorStop(0, "#d8b4fe");
      coreGrad.addColorStop(0.5, "#9333ea");
      coreGrad.addColorStop(1, "#581c87");
      ctx.fillStyle = coreGrad;
      ctx.shadowColor = "rgba(216, 180, 254, 0.8)";
      ctx.shadowBlur = 10;
      ctx.fill();

      // Center sparkle glyph
      ctx.font = "bold 20px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("✦", center, center + 1);
      ctx.restore();

      // ==========================================
      // 5. TOP POINTER NEEDLE (Physical Flapper)
      // ==========================================
      drawPointer(ctx, center, center - sliceRadius + 2, pointerDeflectionRef.current);
    },
    [totalSlices, sliceAngle, currentOptions, isRevealed, revealedWinner, isSpinning]
  );

  // Top Pointer Arrow Drawing
  const drawPointer = (
    ctx: CanvasRenderingContext2D,
    tipX: number,
    tipY: number,
    deflection: number
  ) => {
    ctx.save();
    ctx.translate(tipX, tipY);
    ctx.rotate(deflection);

    // Pointer flapper blade pointing downwards into the wheel
    ctx.beginPath();
    ctx.moveTo(0, 24); // Sharp tip piercing wheel rim
    ctx.lineTo(-15, -16);
    ctx.lineTo(0, -10);
    ctx.lineTo(15, -16);
    ctx.closePath();

    const needleGrad = ctx.createLinearGradient(0, -16, 0, 24);
    needleGrad.addColorStop(0, "#ef4444");
    needleGrad.addColorStop(0.5, "#f43f5e");
    needleGrad.addColorStop(1, "#ffffff");

    ctx.fillStyle = needleGrad;
    ctx.shadowColor = "rgba(244, 63, 94, 0.85)";
    ctx.shadowBlur = 16;
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Pivot chrome pin
    ctx.beginPath();
    ctx.arc(0, -10, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#f8fafc";
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 4;
    ctx.fill();

    ctx.restore();
  };

  // Resize canvas for sharp Retina displays
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const displaySize = Math.min(window.innerWidth - 32, 440);

    canvas.width = displaySize * dpr;
    canvas.height = displaySize * dpr;
    canvas.style.width = `${displaySize}px`;
    canvas.style.height = `${displaySize}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    // Set initial position: if already spun, align to winner
    if (isSpun && winnerIndex !== null && winnerIndex !== undefined) {
      const targetRotation = (3 * Math.PI) / 2 - (winnerIndex + 0.5) * sliceAngle;
      rotationRef.current = targetRotation;
      drawWheel(targetRotation);
    } else {
      drawWheel(rotationRef.current);
    }

    const handleResize = () => {
      if (!canvas) return;
      const newDisplaySize = Math.min(window.innerWidth - 32, 440);
      canvas.width = newDisplaySize * dpr;
      canvas.height = newDisplaySize * dpr;
      canvas.style.width = `${newDisplaySize}px`;
      canvas.style.height = `${newDisplaySize}px`;
      const context = canvas.getContext("2d");
      if (context) {
        context.scale(dpr, dpr);
      }
      drawWheel(rotationRef.current);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawWheel, isSpun, winnerIndex, sliceAngle]);

  // Spin Execution
  const handleSpinClick = async () => {
    if (isSpinning || isSpun || disabled || !onSpinRequest) return;

    try {
      setIsSpinning(true);

      const spinResult = await onSpinRequest();
      if (!spinResult) {
        setIsSpinning(false);
        return;
      }

      const targetWinnerIndex = spinResult.winner_index;
      const targetWinnerChoice = spinResult.winner_choice;
      const allRevealedOptions = spinResult.options;

      // 6 full revolutions for maximum suspense
      const minRevolutions = 6;
      const baseRotation = rotationRef.current;

      const targetAngleWithinCircle = (3 * Math.PI) / 2 - (targetWinnerIndex + 0.5) * sliceAngle;

      const currentMod = baseRotation % (2 * Math.PI);
      let angleDiff = targetAngleWithinCircle - currentMod;
      while (angleDiff < 0) {
        angleDiff += 2 * Math.PI;
      }

      const totalTargetRotation = baseRotation + minRevolutions * (2 * Math.PI) + angleDiff;
      const duration = 5200;
      const startTime = performance.now();

      const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(1, elapsed / duration);
        const easedProgress = easeOutQuart(progress);

        const currentRot = baseRotation + (totalTargetRotation - baseRotation) * easedProgress;
        rotationRef.current = currentRot;

        // Peg audio click detection
        const angleUnderPointer = (3 * Math.PI / 2 - currentRot) % (2 * Math.PI);
        const normalizedAngle = angleUnderPointer < 0 ? angleUnderPointer + 2 * Math.PI : angleUnderPointer;
        const currentPeg = Math.floor(normalizedAngle / sliceAngle);

        if (currentPeg !== lastPegCrossedRef.current) {
          lastPegCrossedRef.current = currentPeg;
          sounds.playTick(currentPeg);
          pointerDeflectionRef.current = 0.32;
        } else {
          pointerDeflectionRef.current *= 0.85;
        }

        drawWheel(currentRot);

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(animate);
        } else {
          // Spin Complete!
          pointerDeflectionRef.current = 0;
          rotationRef.current = totalTargetRotation;
          setIsSpinning(false);

          // Reveal options NOW after landing!
          setCurrentOptions(allRevealedOptions);
          setRevealedWinner({
            index: targetWinnerIndex,
            choice: targetWinnerChoice,
          });

          // Celebration!
          sounds.playWinFanfare();
          sounds.vibrate([100, 50, 150, 50, 200]);

          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.6 },
            colors: ["#a855f7", "#ec4899", "#3b82f6", "#f59e0b", "#10b981"],
          });

          setTimeout(() => {
            confetti({
              particleCount: 70,
              angle: 60,
              spread: 60,
              origin: { x: 0.1, y: 0.7 },
            });
            confetti({
              particleCount: 70,
              angle: 120,
              spread: 60,
              origin: { x: 0.9, y: 0.7 },
            });
          }, 250);
        }
      };

      animFrameRef.current = requestAnimationFrame(animate);
    } catch (err) {
      console.error("Spin animation error:", err);
      setIsSpinning(false);
    }
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="wheel-wrapper" ref={containerRef}>
      {/* Sound Mute Toggle */}
      <div className="wheel-controls-bar">
        <button
          type="button"
          onClick={toggleSound}
          className="wheel-audio-toggle"
          title={soundMuted ? "Unmute Sound" : "Mute Sound"}
          aria-label={soundMuted ? "Unmute Sound" : "Mute Sound"}
        >
          {soundMuted ? "🔇" : "🔊"}
        </button>
      </div>

      {/* Wheel Canvas Container with Neon Glow */}
      <div className={`canvas-glow-container ${isSpinning ? "is-spinning" : ""}`}>
        <canvas ref={canvasRef} className="wheel-canvas" />
      </div>

      {/* Action / Spin Button */}
      <div className="wheel-action-section">
        {!isSpun && !revealedWinner ? (
          <button
            type="button"
            onClick={handleSpinClick}
            disabled={isSpinning || disabled}
            className={`btn-spin-primary ${isSpinning ? "btn-spinning" : ""}`}
            aria-label="Spin the Mystery Wheel"
          >
            {isSpinning ? (
              <span className="flex-center gap-2">
                <span className="spinner-dot" />
                Deciding Fate...
              </span>
            ) : (
              <span className="flex-center gap-2">
                <span className="sparkle-icon">🔮</span>
                SPIN THE WHEEL
              </span>
            )}
          </button>
        ) : (
          <div className="locked-badge-pill">
            <span className="lock-icon">🔒</span>
            <span>Result Decided & Locked</span>
          </div>
        )}
      </div>

      {/* Winner Spotlight Card */}
      {revealedWinner && (
        <div className="winner-celebration-card animate-pop-in">
          <div className="winner-tag">THE WHEEL HAS SPOKEN</div>
          <div className="winner-choice-display">
            ✨ {revealedWinner.choice} ✨
          </div>
          <p className="winner-subtext">
            All mystery options have been revealed below!
          </p>
        </div>
      )}
    </div>
  );
};
