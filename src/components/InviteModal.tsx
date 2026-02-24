"use client";

import { useState } from "react";

interface InviteModalProps {
  roomId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function InviteModal({
  roomId,
  isOpen,
  onClose,
}: InviteModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const roomLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/room/${roomId}`
      : "";

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-zinc-900 shadow-2xl p-6 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md animate-in duration-200 fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="top-4 right-4 absolute text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h3 className="mb-1 font-bold text-lg text-zinc-900 dark:text-zinc-100">
          Invite Peers
        </h3>
        <p className="mb-5 text-sm text-zinc-500 dark:text-zinc-400">
          Share the link or room ID to invite others
        </p>

        {/* Room Link */}
        <div className="mb-4">
          <label className="block mb-1.5 font-semibold text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Room Link
          </label>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={roomLink}
              className="flex-1 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono text-sm text-zinc-700 dark:text-zinc-300 truncate"
            />
            <button
              onClick={() => handleCopy(roomLink)}
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 px-3 py-2 rounded-lg font-medium text-sm text-white whitespace-nowrap transition-all duration-200"
            >
              {copied ? (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Room ID */}
        <div>
          <label className="block mb-1.5 font-semibold text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Room ID
          </label>
          <div className="flex items-center gap-2">
            <code className="block flex-1 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono text-sm text-zinc-700 dark:text-zinc-300 truncate">
              {roomId}
            </code>
            <button
              onClick={() => handleCopy(roomId)}
              className="bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 px-3 py-2 rounded-lg font-medium text-sm text-zinc-700 dark:text-zinc-300 transition-all duration-200"
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
