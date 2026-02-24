"use client";

import React from "react";
import AnalogTimer from "./AnalogTimer";
import GoalList from "./GoalList";

interface Goal {
  id: string;
  text: string;
  is_completed: boolean;
}

interface MemberCardProps {
  name: string;
  isCurrentUser: boolean;
  totalSeconds: number;
  remainingSeconds: number;
  isPaused: boolean;
  goals: Goal[];
  onTogglePause: () => void;
  onAddGoal: (text: string) => void;
  onToggleGoal: (goalId: string, completed: boolean) => void;
  onDeleteGoal: (goalId: string) => void;
}

export default function MemberCard({
  name = "Anonymous",
  isCurrentUser,
  totalSeconds,
  remainingSeconds,
  isPaused,
  goals,
  onTogglePause,
  onAddGoal,
  onToggleGoal,
  onDeleteGoal,
}: MemberCardProps) {
  const completedGoals = goals.filter((g) => g.is_completed).length;
  const totalGoals = goals.length;

  return (
    <div
      className={`relative rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg ${
        isCurrentUser
          ? "border-violet-500/50 bg-violet-50/50 dark:bg-violet-950/20 shadow-md shadow-violet-500/10"
          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50"
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              isCurrentUser
                ? "bg-violet-600 text-white"
                : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
            }`}
          >
            {name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div>
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              {name || "Anonymous"}
              {isCurrentUser && (
                <span className="bg-violet-100 dark:bg-violet-900/50 ml-2 px-1.5 py-0.5 rounded-full font-medium text-[10px] text-violet-600 dark:text-violet-400">
                  You
                </span>
              )}
            </h3>
            {totalGoals > 0 && (
              <p className="text-[10px] text-zinc-400 dark:text-zinc-600">
                {completedGoals}/{totalGoals} goals done
              </p>
            )}
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-1.5">
          <div
            className={`w-2 h-2 rounded-full ${
              isPaused
                ? "bg-zinc-300 dark:bg-zinc-600"
                : "bg-emerald-500 animate-pulse"
            }`}
          />
          <span className="font-medium text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            {remainingSeconds === 0 ? "Done" : isPaused ? "Paused" : "Focusing"}
          </span>
        </div>
      </div>

      {/* Timer */}
      <div className="mb-4">
        <AnalogTimer
          totalSeconds={totalSeconds}
          remainingSeconds={remainingSeconds}
          isPaused={isPaused}
          isOwner={isCurrentUser}
          onTogglePause={onTogglePause}
        />
      </div>

      {/* Goals */}
      <GoalList
        goals={goals}
        isOwner={isCurrentUser}
        onAddGoal={onAddGoal}
        onToggleGoal={onToggleGoal}
        onDeleteGoal={onDeleteGoal}
      />
    </div>
  );
}
