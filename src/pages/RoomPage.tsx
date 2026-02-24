import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { getOrCreateUserId, getUserName, setUserName } from "@/lib/user";
import { useAuth } from "@/context/AuthContext";
import MemberCard from "@/components/MemberCard";
import InviteModal from "@/components/InviteModal";
import { v4 as uuidv4 } from "uuid";

interface Room {
  id: string;
  name: string;
  timer_duration: number;
}

interface Member {
  id: string;
  user_id: string;
  name: string;
  timer_remaining: number;
  is_paused: boolean;
  last_tick_at: string;
}

interface Goal {
  id: string;
  member_id: string;
  text: string;
  is_completed: boolean;
}

export default function RoomPage() {
  const params = useParams();
  const roomId = params.id as string;
  const navigate = useNavigate();

  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [joinName, setJoinName] = useState("");
  const [joining, setJoining] = useState(false);

  const userId = getOrCreateUserId();
  const currentMember = members.find((m) => m.user_id === userId);
  const isMember = !!currentMember;

  // We use refs to avoid recreating the interval on every state update
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      // 1. Fetch Room
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (roomError) throw roomError;
      setRoom(roomData);

      // 2. Fetch Members
      const { data: membersData, error: membersError } = await supabase
        .from("members")
        .select("*")
        .eq("room_id", roomId)
        .order("joined_at", { ascending: true });

      if (membersError) throw membersError;
      setMembers(membersData);

      // 3. Fetch Goals
      const memberIds = membersData.map((m) => m.id);
      if (memberIds.length > 0) {
        const { data: goalsData, error: goalsError } = await supabase
          .from("goals")
          .select("*")
          .in("member_id", memberIds)
          .order("created_at", { ascending: true });

        if (goalsError) throw goalsError;
        setGoals(goalsData);
      }
    } catch (err) {
      console.error("Error loading room data:", err);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  const { user: authUser } = useAuth();

  useEffect(() => {
    loadData();
    if (authUser) {
      setJoinName(authUser.display_name);
    } else {
      const name = getUserName();
      if (name) setJoinName(name);
    }
  }, [loadData, authUser]);

  // Real-time Subscriptions
  useEffect(() => {
    const membersChannel = supabase
      .channel(`members-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "members",
          filter: `room_id=eq.${roomId}`,
        },
        () => loadData(), // Reload on any member changes
      )
      .subscribe();

    const goalsChannel = supabase
      .channel(`goals-${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "goals" },
        () => loadData(), // Reload on any goal changes
      )
      .subscribe();

    return () => {
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(goalsChannel);
    };
  }, [roomId, loadData]);

  // Client-side Timer tick
  useEffect(() => {
    const tickInterval = setInterval(() => {
      setMembers((prevMembers) =>
        prevMembers.map((m) => {
          if (!m.is_paused && m.timer_remaining > 0) {
            return {
              ...m,
              timer_remaining: Math.max(0, m.timer_remaining - 1),
            };
          }
          return m;
        }),
      );
    }, 1000);

    return () => clearInterval(tickInterval);
  }, []);

  // Sync to database
  useEffect(() => {
    if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);

    syncIntervalRef.current = setInterval(async () => {
      if (!currentMember) return;
      // Find the LATEST state from the members array
      const latestMe = members.find((m) => m.id === currentMember.id);
      if (!latestMe) return;

      if (!latestMe.is_paused) {
        await supabase
          .from("members")
          .update({
            timer_remaining: latestMe.timer_remaining,
            last_tick_at: new Date().toISOString(),
          })
          .eq("id", latestMe.id);
      }
    }, 5000); // Sync every 5 seconds to reduce rate limiting

    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [currentMember, members]);

  const handleTogglePause = async (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (!member || member.user_id !== userId) return; // Only owner can pause

    // Optimistic update
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId ? { ...m, is_paused: !m.is_paused } : m,
      ),
    );

    await supabase
      .from("members")
      .update({
        is_paused: !member.is_paused,
        last_tick_at: new Date().toISOString(),
      })
      .eq("id", memberId);
  };

  const handleAddGoal = async (memberId: string, text: string) => {
    const goalId = uuidv4();
    const newGoal = {
      id: goalId,
      member_id: memberId,
      room_id: roomId,
      text,
      is_completed: false,
      created_at: new Date().toISOString(),
    };

    // Optimistic update
    setGoals((prev) => [...prev, newGoal as any]);

    await supabase.from("goals").insert(newGoal);
  };

  const handleToggleGoal = async (goalId: string, isCompleted: boolean) => {
    // Optimistic update
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId ? { ...g, is_completed: isCompleted } : g,
      ),
    );

    await supabase
      .from("goals")
      .update({ is_completed: isCompleted })
      .eq("id", goalId);
  };

  const handleDeleteGoal = async (goalId: string) => {
    // Optimistic update
    setGoals((prev) => prev.filter((g) => g.id !== goalId));

    await supabase.from("goals").delete().eq("id", goalId);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinName.trim() || !room) return;

    setJoining(true);
    try {
      setUserName(joinName.trim());
      const memberId = uuidv4();

      await supabase.from("members").insert({
        id: memberId,
        room_id: roomId,
        name: joinName.trim(),
        user_id: userId,
        timer_remaining: room.timer_duration,
        is_paused: true,
        last_tick_at: new Date().toISOString(),
        joined_at: new Date().toISOString(),
      });

      await loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to join room");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="border-4 border-violet-500/30 border-t-violet-600 rounded-full w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] text-center">
        <h2 className="mb-2 font-bold text-2xl text-zinc-900 dark:text-zinc-100">
          Room Not Found
        </h2>
        <p className="mb-6 text-zinc-500 dark:text-zinc-400">
          The room you're looking for doesn't exist or has been removed.
        </p>
        <button
          onClick={() => navigate("/")}
          className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-6 py-2.5 rounded-xl font-medium text-sm transition-colors"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-4 mb-8 pb-6 border-zinc-200 dark:border-zinc-800 border-b">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">{room.name}</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {members.length} {members.length === 1 ? "peer" : "peers"} focusing
            together
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-4 py-2 rounded-xl font-medium text-sm text-zinc-700 dark:text-zinc-300 transition-colors"
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
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
          Invite Peers
        </button>
      </div>

      {/* Join Form if not member */}
      {!isMember && (
        <div className="bg-violet-50 dark:bg-violet-900/10 mb-8 p-6 border border-violet-100 dark:border-violet-500/20 rounded-2xl">
          <h3 className="mb-2 font-bold text-lg text-violet-900 dark:text-violet-100">
            Join this session
          </h3>
          <p className="mb-4 text-sm text-violet-700 dark:text-violet-300">
            Enter your name to join the room and start your timer.
          </p>
          <form onSubmit={handleJoin} className="flex gap-3">
            <input
              type="text"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              placeholder="Your name"
              required
              className="flex-1 bg-white dark:bg-zinc-900 px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
            />
            <button
              type="submit"
              disabled={joining || !joinName.trim()}
              className="bg-violet-600 hover:bg-violet-500 disabled:bg-violet-400 px-6 py-2.5 rounded-xl font-medium text-sm text-white transition-colors"
            >
              {joining ? "Joining..." : "Join"}
            </button>
          </form>
        </div>
      )}

      {/* Members Grid */}
      <div className="gap-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <MemberCard
            key={member.id}
            name={member.name}
            isCurrentUser={member.user_id === userId}
            totalSeconds={room.timer_duration}
            remainingSeconds={member.timer_remaining}
            isPaused={member.is_paused}
            goals={goals.filter((g) => g.member_id === member.id)}
            onTogglePause={() => handleTogglePause(member.id)}
            onAddGoal={(text) => handleAddGoal(member.id, text)}
            onToggleGoal={handleToggleGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        ))}
      </div>

      <InviteModal
        roomId={roomId}
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
      />
    </div>
  );
}
