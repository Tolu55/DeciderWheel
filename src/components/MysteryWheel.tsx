"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import confetti from "canvas-confetti";
import { sounds } from "@/lib/sound";

interface MysteryWheelProps {
  optionCount: number;
  options?: string[]; // Defined if revealed or creator
  winnerIndex?: number | null;
  winnerChoice?: string | null;
  isSpun: boolean;
  onSpinRequest?: () => Promise<{ winner_index: number; winner_choice: string; options: string[] } | null>;
  disabled?: boolean;
}

// Curated high-contrast mystery palette
const SLICE_COLORS = [
  { bg: "#6366f1", accent: "#818cf8", dark: "#4338ca", text: "#ffffff" }, // Indigo
  { bg: "#ec4899", accent: "#f472b6", dark: "#be185d", text: "#ffffff" }, // Pink
  { bg: "#06b6d4", accent: "#22d3ee", dark: "#0e7490", text: "#ffffff" }, // Cyan
  { bg: "#f59e0b", accent: "#fbbf24", dark: "#b45309", text: "#ffffff" }, // Amber
  { bg: "#10b981", accent: "#34d399", dark: "#047857", text: "#ffffff" }, // Emerald
  { bg: "#8b5cf6", accent: "#a78bfa", dark: "#6d28d9", text: "#ffffff" }, // Violet
  { bg: "#ef4444", accent: "#f87171", dark: "#b91c1c", text: "#ffffff" }, // Red
  { bg: "#14b8a6", accent: "#2dd4bf", dark: "#0f766e", text: "#ffffff" }, // Teal
  { bg: "#f97316", accent: "#fb923c", dark: "#c2410c", text: "#ffffff" }, // Orange
  { bg: "#3b82f6", accent: "#60a5fa", dark: "#1d4ed8", text: "#ffffff" }, // Blue
  { bg: "#d946ef", accent: "#e879f9", dark: "#a21caf", text: "#ffffff" }, // Fuchsia
  { bg: "#84cc16", accent: "#a3e635", dark: "#4d7c0f", text: "#ffffff" }, // Lime
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
  const [currentOptions, setCurrentOptions] = useState<string[] | undefined>(options);
  const [revealedWinner, setRevealedWinner] = useState<{ index: number; choice: string } | null>(
    isSpun && winnerIndex !== null && winnerIndex !== undefined && winnerChoice
      ? { index: winnerIndex, choice: winnerChoice }
      : null
  );
  const [soundMuted, setSoundMuted] = useState(false);

  // Wheel animation state refs
  const rotationRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const lastPegCrossedRef = useRef<number>(-1);
  const pointerDeflectionRef = useRef<number>(0);

  // Synchronize options when updated (e.g. creator view or post-spin)
  useEffect(() => {
    if (options && options.length > 0) {
      setCurrentOptions(options);
    }
  }, [options]);

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

  // Draw wheel on canvas
  const drawWheel = useCallback(
    (rotation: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const size = canvas.width;
      const center = size / 2;
      const radius = center - 24;

      ctx.clearRect(0, 0, size, size);

      // Save context
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(rotation);

      // Outer glowing ring shadow
      ctx.shadowColor = "rgba(139, 92, 246, 0.4)";
      ctx.shadowBlur = 20;

      // Draw each slice
      for (let i = 0; i < totalSlices; i++) {
        const startAngle = i * sliceAngle;
        const endAngle = startAngle + sliceAngle;
        const color = SLICE_COLORS[i % SLICE_COLORS.length];
        const isWinnerSlice = revealedWinner !== null && revealedWinner.index === i;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, startAngle, endAngle);
        ctx.closePath();

        // Fill with gradient for 3D depth
        const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, radius);
        if (isWinnerSlice) {
          grad.addColorStop(0, "#fbbf24");
          grad.addColorStop(0.7, "#f59e0b");
          grad.addColorStop(1, "#d97706");
        } else {
          grad.addColorStop(0, color.accent);
          grad.addColorStop(0.7, color.bg);
          grad.addColorStop(1, color.dark);
        }

        ctx.fillStyle = grad;
        ctx.fill();

        // Slice borders
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Draw Content: Mystery glyph or Revealed Option Text
        ctx.save();
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";

        const hasRevealedText = Boolean(currentOptions && currentOptions[i]);

        if (hasRevealedText) {
          // Revealed Option Name
          const text = currentOptions![i];
          const fontSize = Math.max(14, Math.min(20, Math.floor(260 / Math.max(10, text.length))));
          ctx.font = `bold ${fontSize}px var(--font-sans, system-ui, sans-serif)`;
          ctx.fillStyle = isWinnerSlice ? "#1e1b4b" : color.text;
          ctx.shadowColor = isWinnerSlice ? "rgba(255,255,255,0.8)" : "rgba(0, 0, 0, 0.7)";
          ctx.shadowBlur = 4;

          // Truncate long strings for wheel display
          const maxLen = totalSlices > 8 ? 14 : 20;
          const displayText = text.length > maxLen ? text.substring(0, maxLen - 1) + "…" : text;
          ctx.fillText(displayText, radius - 35, 0);

          // Small segment number pill near center
          ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
          ctx.font = "bold 11px var(--font-sans, system-ui, sans-serif)";
          ctx.fillText(`#${i + 1}`, radius - 15, -fontSize * 0.9);
        } else {
          // Mystery Slice: Anonymous '?' with glow!
          ctx.font = "bold 32px var(--font-sans, system-ui, sans-serif)";
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "rgba(255, 255, 255, 0.9)";
          ctx.shadowBlur = 10;
          ctx.fillText("?", radius - 45, 0);

          // Subtitle "#1", "#2"
          ctx.font = "600 12px var(--font-sans, system-ui, sans-serif)";
          ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
          ctx.shadowBlur = 2;
          ctx.fillText(`Choice ${i + 1}`, radius - 20, 22);
        }

        ctx.restore();
      }

      // Draw perimeter pegs (for physics click sounds & tactile appearance)
      for (let i = 0; i < totalSlices; i++) {
        const pegAngle = i * sliceAngle;
        const px = Math.cos(pegAngle) * (radius - 4);
        const py = Math.sin(pegAngle) * (radius - 4);

        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 8;
        ctx.fill();

        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.restore(); // Restore center translate & rotate

      // Draw Outer Rim / Bezel
      ctx.beginPath();
      ctx.arc(center, center, radius + 4, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 8;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(center, center, radius + 8, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(139, 92, 246, 0.35)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Center Mystery Hub
      ctx.save();
      ctx.beginPath();
      ctx.arc(center, center, 44, 0, Math.PI * 2);
      const hubGrad = ctx.createRadialGradient(center, center, 4, center, center, 44);
      hubGrad.addColorStop(0, "#1e1b4b");
      hubGrad.addColorStop(0.7, "#0f172a");
      hubGrad.addColorStop(1, "#020617");
      ctx.fillStyle = hubGrad;
      ctx.shadowColor = "rgba(147, 51, 234, 0.6)";
      ctx.shadowBlur = 18;
      ctx.fill();

      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Hub glyph (sparkle / question mark / dice)
      ctx.font = "bold 22px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#c084fc";
      ctx.shadowColor = "#c084fc";
      ctx.shadowBlur = 12;
      ctx.fillText("✦", center, center);
      ctx.restore();

      // Draw Top Pointer with Dynamic Deflection
      drawPointer(ctx, center, center - radius, pointerDeflectionRef.current);
    },
    [totalSlices, sliceAngle, currentOptions, revealedWinner]
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

    // Glowing needle
    ctx.beginPath();
    ctx.moveTo(0, 18); // pointer tip piercing wheel rim
    ctx.lineTo(-14, -20);
    ctx.lineTo(0, -14);
    ctx.lineTo(14, -20);
    ctx.closePath();

    const needleGrad = ctx.createLinearGradient(0, -20, 0, 18);
    needleGrad.addColorStop(0, "#f43f5e");
    needleGrad.addColorStop(0.6, "#fb7185");
    needleGrad.addColorStop(1, "#ffffff");

    ctx.fillStyle = needleGrad;
    ctx.shadowColor = "rgba(244, 63, 94, 0.8)";
    ctx.shadowBlur = 14;
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Needle pivot pin
    ctx.beginPath();
    ctx.arc(0, -12, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
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
      // Calculate rotation that places winnerIndex right under top pointer (which is at -PI/2)
      // Wedge center is (winnerIndex + 0.5) * sliceAngle
      // Rotation + wedgeCenter = 3*PI/2 (top)
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

      // Trigger spin request to server to determine the outcome atomically
      const spinResult = await onSpinRequest();
      if (!spinResult) {
        setIsSpinning(false);
        return;
      }

      const targetWinnerIndex = spinResult.winner_index;
      const targetWinnerChoice = spinResult.winner_choice;
      const allRevealedOptions = spinResult.options;

      // Calculate final target rotation:
      // Minimum 6 full revolutions (12 * PI) for dramatic suspense
      const minRevolutions = 6;
      const baseRotation = rotationRef.current;
      
      // Top pointer is at angle 3*PI / 2
      // Wedge center of winnerIndex is (targetWinnerIndex + 0.5) * sliceAngle
      const targetAngleWithinCircle = (3 * Math.PI) / 2 - (targetWinnerIndex + 0.5) * sliceAngle;
      
      // Find smallest rotation > baseRotation + (minRevolutions * 2 * PI) that matches targetAngleWithinCircle
      const currentMod = baseRotation % (2 * Math.PI);
      let angleDiff = targetAngleWithinCircle - currentMod;
      while (angleDiff < 0) {
        angleDiff += 2 * Math.PI;
      }

      const totalTargetRotation = baseRotation + minRevolutions * (2 * Math.PI) + angleDiff;
      const spinDuration = 5200; // 5.2 seconds of thrilling deceleration
      const startTime = performance.now();

      // Check prefers-reduced-motion
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const duration = prefersReducedMotion ? 1200 : spinDuration;

      // Cubic Bezier Easing out: starts fast, smoothly glides to a stop
      const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(1, elapsed / duration);
        const easedProgress = easeOutQuart(progress);

        const currentRot = baseRotation + (totalTargetRotation - baseRotation) * easedProgress;
        rotationRef.current = currentRot;

        // Peg audio click detection:
        // Top pointer is at (3*PI / 2). Current angle on wheel under pointer:
        const angleUnderPointer = (3 * Math.PI / 2 - currentRot) % (2 * Math.PI);
        const normalizedAngle = angleUnderPointer < 0 ? angleUnderPointer + 2 * Math.PI : angleUnderPointer;
        const currentPeg = Math.floor(normalizedAngle / sliceAngle);

        if (currentPeg !== lastPegCrossedRef.current) {
          lastPegCrossedRef.current = currentPeg;
          sounds.playTick(currentPeg);
          pointerDeflectionRef.current = 0.28; // Deflect pointer
        } else {
          // Pointer springs back to rest
          pointerDeflectionRef.current *= 0.85;
        }

        drawWheel(currentRot);

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(animate);
        } else {
          // Spin Complete!
          pointerDeflectionRef.current = 0;
          drawWheel(totalTargetRotation);
          setIsSpinning(false);

          // Update revealed state
          setCurrentOptions(allRevealedOptions);
          setRevealedWinner({
            index: targetWinnerIndex,
            choice: targetWinnerChoice,
          });

          // Celebration!
          sounds.playWinFanfare();
          sounds.vibrate([100, 50, 150, 50, 200]);

          // Confetti explosion
          confetti({
            particleCount: 110,
            spread: 80,
            origin: { y: 0.6 },
            colors: ["#a855f7", "#ec4899", "#3b82f6", "#f59e0b", "#10b981"],
          });

          setTimeout(() => {
            confetti({
              particleCount: 60,
              angle: 60,
              spread: 60,
              origin: { x: 0.1, y: 0.7 },
            });
            confetti({
              particleCount: 60,
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
      {/* Sound Mute Toggle & Reduced Motion Indicator */}
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

      {/* Wheel Canvas Container */}
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

      {/* Winner Spotlight Card (Once Landed or If Already Spun) */}
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
