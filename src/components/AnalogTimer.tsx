"use client";

import React, { useEffect, useRef } from "react";

interface AnalogTimerProps {
  totalSeconds: number;
  remainingSeconds: number;
  isPaused: boolean;
  isOwner: boolean;
  onTogglePause: () => void;
}

export default function AnalogTimer({
  totalSeconds,
  remainingSeconds,
  isPaused,
  isOwner,
  onTogglePause,
}: AnalogTimerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const size = 160;
  const center = size / 2;
  const radius = center - 12;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // HiDPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, size, size);

    const isDark = document.documentElement.classList.contains("dark");
    const bgColor = isDark ? "#18181b" : "#f4f4f5";
    const trackColor = isDark ? "#27272a" : "#e4e4e7";
    const tickColor = isDark ? "#3f3f46" : "#a1a1aa";
    const textColor = isDark ? "#fafafa" : "#18181b";
    const accentColor = "#8b5cf6"; // violet-500
    const accentGlow = "rgba(139, 92, 246, 0.3)";

    // Background circle
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fillStyle = bgColor;
    ctx.fill();

    // Track ring
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.strokeStyle = trackColor;
    ctx.lineWidth = 6;
    ctx.stroke();

    // Progress arc
    const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + progress * Math.PI * 2;

    if (progress > 0) {
      ctx.beginPath();
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.shadowColor = accentGlow;
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Tick marks
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
      const isMajor = i % 5 === 0;
      const innerR = radius - (isMajor ? 14 : 8);
      const outerR = radius - 4;

      ctx.beginPath();
      ctx.moveTo(
        center + Math.cos(angle) * innerR,
        center + Math.sin(angle) * innerR,
      );
      ctx.lineTo(
        center + Math.cos(angle) * outerR,
        center + Math.sin(angle) * outerR,
      );
      ctx.strokeStyle = isMajor ? textColor : tickColor;
      ctx.lineWidth = isMajor ? 1.5 : 0.75;
      ctx.stroke();
    }

    // Hand
    const handAngle = startAngle + progress * Math.PI * 2;
    const handLength = radius - 20;

    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.lineTo(
      center + Math.cos(handAngle) * handLength,
      center + Math.sin(handAngle) * handLength,
    );
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.shadowColor = accentGlow;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Center dot
    ctx.beginPath();
    ctx.arc(center, center, 4, 0, Math.PI * 2);
    ctx.fillStyle = accentColor;
    ctx.fill();

    // Digital time text
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    const timeStr = `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;

    ctx.font = '600 14px "Inter", system-ui, sans-serif';
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(timeStr, center, center + 30);
  }, [remainingSeconds, totalSeconds, center, radius]);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="drop-shadow-lg"
      />
      {isOwner && (
        <button
          onClick={onTogglePause}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
            isPaused
              ? "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/25"
              : "bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300"
          }`}
        >
          {isPaused ? (
            <>
              <svg
                className="w-3.5 h-3.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              Start
            </>
          ) : (
            <>
              <svg
                className="w-3.5 h-3.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Pause
            </>
          )}
        </button>
      )}
    </div>
  );
}
