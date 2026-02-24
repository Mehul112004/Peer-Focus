"use client";

import React, { useState } from "react";

interface Goal {
  id: string;
  text: string;
  is_completed: boolean;
}

interface GoalListProps {
  goals: Goal[];
  isOwner: boolean;
  onAddGoal: (text: string) => void;
  onToggleGoal: (goalId: string, completed: boolean) => void;
  onDeleteGoal: (goalId: string) => void;
}

export default function GoalList({
  goals,
  isOwner,
  onAddGoal,
  onToggleGoal,
  onDeleteGoal,
}: GoalListProps) {
  const [newGoal, setNewGoal] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGoal.trim()) {
      onAddGoal(newGoal.trim());
      setNewGoal("");
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <h4 className="font-semibold text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
        Goals
      </h4>

      <div className="flex flex-col gap-1.5 pr-1 max-h-40 overflow-y-auto scrollbar-thin">
        {goals.length === 0 && (
          <p className="text-xs text-zinc-400 dark:text-zinc-600 italic">
            No goals set yet
          </p>
        )}
        {goals.map((goal) => (
          <div
            key={goal.id}
            className="group flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 px-1.5 py-1 rounded-md transition-colors"
          >
            <button
              onClick={() =>
                isOwner && onToggleGoal(goal.id, !goal.is_completed)
              }
              disabled={!isOwner}
              className={`flex-shrink-0 w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                goal.is_completed
                  ? "bg-violet-600 border-violet-600"
                  : "border-zinc-300 dark:border-zinc-600 hover:border-violet-400"
              } ${!isOwner ? "cursor-default" : "cursor-pointer"}`}
            >
              {goal.is_completed && (
                <svg
                  className="w-2.5 h-2.5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
            <span
              className={`text-sm flex-1 transition-all duration-200 ${
                goal.is_completed
                  ? "line-through text-zinc-400 dark:text-zinc-600"
                  : "text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {goal.text}
            </span>
            {isOwner && (
              <button
                onClick={() => onDeleteGoal(goal.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-red-400 transition-all duration-200"
              >
                <svg
                  className="w-3.5 h-3.5"
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
            )}
          </div>
        ))}
      </div>

      {isOwner && (
        <form onSubmit={handleSubmit} className="flex gap-2 mt-1">
          <input
            type="text"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            placeholder="Add a goal..."
            className="flex-1 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 border border-zinc-200 focus:border-violet-500 dark:border-zinc-700 rounded-lg text-sm text-zinc-800 dark:text-zinc-200 transition-all placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
          <button
            type="submit"
            disabled={!newGoal.trim()}
            className="bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 px-3 py-1.5 rounded-lg font-medium text-sm text-white disabled:text-zinc-500 transition-all duration-200 disabled:cursor-not-allowed"
          >
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
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </form>
      )}
    </div>
  );
}
