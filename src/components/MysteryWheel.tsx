"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import confetti from "canvas-confetti";
import { sounds } from "@/lib/sound";

interface MysteryWheelProps {
  optionCount: number;
  options?: string[];
  winnerIndex?: number | null;
  winnerChoice?: string | null;
  isSpun: boolean;
  onSpinRequest?: () => Promise<{ winner_index: number; winner_choice: string; options: string[] } | null>;
  disabled?: boolean;
}

// Flat, vibrant slice colors matching the reference design (NO GRADIENTS)
export const FLAT_SLICE_COLORS = [
  "#ffcc00", // Bright Yellow
  "#ff6b18", // Vibrant Orange
  "#ff4785", // Punchy Pink
  "#00c49f", // Teal / Mint
  "#a855f7", // Vivid Purple
  "#65d400", // Lime Green
  "#3b82f6", // Sky Blue
  "#ef4444", // Coral Red
  "#c084fc", // Lavender
  "#ff8a65", // Warm Coral
  "#38bdf8", // Cyan
  "#34d399", // Emerald
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

  // Wheel state refs
  const rotationRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const lastPegCrossedRef = useRef<number>(-1);
  const pointerDeflectionRef = useRef<number>(0);

  useEffect(() => {
    if (isSpun && options && options.length > 0) {
      setCurrentOptions(options);
    }
  }, [isSpun, options]);

  const totalSlices = Math.max(2, currentOptions ? currentOptions.length : optionCount);
  const sliceAngle = (2 * Math.PI) / totalSlices;

  // Draw wheel on canvas matching the reference design (Clean, Flat, No Gradients, Unclipped)
  const drawWheel = useCallback(
    (rotation: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const size = canvas.width;
      const center = size / 2;

      // 44px padding around the wheel so the top pointer and 7px border NEVER get cropped
      const wheelRadius = center - 44;

      ctx.clearRect(0, 0, size, size);

      // ==========================================
      // 1. ROTATING SLICE SEGMENTS (NO GRADIENTS)
      // ==========================================
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(rotation);

      for (let i = 0; i < totalSlices; i++) {
        const startAngle = i * sliceAngle;
        const endAngle = startAngle + sliceAngle;
        const color = FLAT_SLICE_COLORS[i % FLAT_SLICE_COLORS.length];

        // Slice wedge
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, wheelRadius, startAngle, endAngle);
        ctx.closePath();

        // Flat solid color fill (Strictly NO gradient)
        ctx.fillStyle = color;
        ctx.fill();

        // White slice divider border
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // ==========================================
        // 2. ANONYMOUS PLACEHOLDER '?' ON EACH SECTION
        // ==========================================
        ctx.save();
        ctx.rotate(startAngle + sliceAngle / 2);

        const placeholderDist = wheelRadius * 0.63;
        const isWinnerSlice = (isSpun || revealedWinner !== null) && revealedWinner?.index === i;

        if (isWinnerSlice) {
          // Winning slice displays a golden star badge
          ctx.font = `800 ${totalSlices <= 4 ? 32 : 24}px system-ui, -apple-system, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
          ctx.shadowBlur = 6;
          ctx.fillText("★", placeholderDist, 0);
        } else {
          // Anonymous '?' placeholder on each section
          const qFontSize = totalSlices <= 4 ? 30 : totalSlices <= 6 ? 24 : totalSlices <= 8 ? 20 : 16;
          ctx.font = `800 ${qFontSize}px system-ui, -apple-system, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
          ctx.shadowBlur = 4;
          ctx.fillText("?", placeholderDist, 0);
        }

        ctx.restore();
      }

      ctx.restore(); // Restore center translate & rotate

      // ==========================================
      // 3. THICK WHITE WHEEL RIM (From Reference)
      // ==========================================
      ctx.beginPath();
      ctx.arc(center, center, wheelRadius, 0, Math.PI * 2);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 7;
      ctx.stroke();

      // ==========================================
      // 4. CENTER HUB: DARK CIRCLE WITH WHITE '?'
      // ==========================================
      const hubRadius = Math.max(26, Math.min(36, wheelRadius * 0.22));

      // Dark circle
      ctx.beginPath();
      ctx.arc(center, center, hubRadius, 0, Math.PI * 2);
      ctx.fillStyle = "#15182e";
      ctx.fill();

      // Clean white '?' glyph
      ctx.font = `800 ${Math.round(hubRadius * 1.15)}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("?", center, center + 1);

      // ==========================================
      // 5. TOP TEARDROP POINTER (From Reference)
      // ==========================================
      drawPointer(ctx, center, center - wheelRadius + 2, pointerDeflectionRef.current);
    },
    [totalSlices, sliceAngle, isSpun, revealedWinner]
  );

  // Top Pointer: Yellow teardrop pin with black border & black dot (matches reference)
  const drawPointer = (
    ctx: CanvasRenderingContext2D,
    tipX: number,
    tipY: number,
    deflection: number
  ) => {
    ctx.save();
    ctx.translate(tipX, tipY);
    ctx.rotate(deflection);

    // Teardrop pin pointing down into the wheel
    ctx.beginPath();
    ctx.moveTo(0, 14); // Tip pointing down into the wheel
    ctx.lineTo(-12, -22);
    ctx.arc(0, -22, 12, Math.PI, 0, false);
    ctx.lineTo(0, 14);
    ctx.closePath();

    // Solid flat yellow fill
    ctx.fillStyle = "#ffcc00";
    ctx.fill();

    // Bold black stroke
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = 2.8;
    ctx.lineJoin = "round";
    ctx.stroke();

    // Center black dot / eye inside pointer
    ctx.beginPath();
    ctx.arc(0, -20, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = "#111111";
    ctx.fill();

    ctx.restore();
  };

  // Resize canvas for sharp displays
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const displaySize = Math.min(window.innerWidth - 48, 380);

    canvas.width = displaySize * dpr;
    canvas.height = displaySize * dpr;
    canvas.style.width = `${displaySize}px`;
    canvas.style.height = `${displaySize}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    if (isSpun && winnerIndex !== null && winnerIndex !== undefined) {
      const targetRotation = (3 * Math.PI) / 2 - (winnerIndex + 0.5) * sliceAngle;
      rotationRef.current = targetRotation;
      drawWheel(targetRotation);
    } else {
      drawWheel(rotationRef.current);
    }

    const handleResize = () => {
      if (!canvas) return;
      const newDisplaySize = Math.min(window.innerWidth - 48, 380);
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

      const minRevolutions = 6;
      const baseRotation = rotationRef.current;

      const targetAngleWithinCircle = (3 * Math.PI) / 2 - (targetWinnerIndex + 0.5) * sliceAngle;

      const currentMod = baseRotation % (2 * Math.PI);
      let angleDiff = targetAngleWithinCircle - currentMod;
      while (angleDiff < 0) {
        angleDiff += 2 * Math.PI;
      }

      const totalTargetRotation = baseRotation + minRevolutions * (2 * Math.PI) + angleDiff;
      const duration = 4800;
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
          pointerDeflectionRef.current = 0.28;
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

          setCurrentOptions(allRevealedOptions);
          setRevealedWinner({
            index: targetWinnerIndex,
            choice: targetWinnerChoice,
          });

          sounds.playWinFanfare();
          sounds.vibrate([100, 50, 150]);

          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
            colors: ["#ffcc00", "#ff4785", "#00c49f", "#ffffff", "#ff6b18"],
          });
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
    <div className="wheel-wrapper-clean" ref={containerRef}>
      {/* Wheel Canvas Container */}
      <div className="wheel-canvas-box">
        <canvas ref={canvasRef} className="wheel-canvas-clean" />
      </div>

      {/* Primary Action Button (Big Yellow 'Spin' button from reference) */}
      {!isSpun && !revealedWinner && (
        <div className="wheel-btn-container">
          <button
            type="button"
            onClick={handleSpinClick}
            disabled={isSpinning || disabled}
            className="btn-spin-flat"
            aria-label="Spin"
          >
            {isSpinning ? "Spinning..." : "Spin"}
          </button>
        </div>
      )}
    </div>
  );
};
