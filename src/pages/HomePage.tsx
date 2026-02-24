import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { getOrCreateUserId, getUserName, setUserName } from "@/lib/user";
import { v4 as uuidv4 } from "uuid";

export default function HomePage() {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [joinRoomId, setJoinRoomId] = useState("");
  const [joinName, setJoinName] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    const name = getUserName();
    if (name) {
      setDisplayName(name);
      setJoinName(name);
    }
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim() || !displayName.trim()) return;

    setLoading(true);
    try {
      const userId = getOrCreateUserId();
      setUserName(displayName.trim());

      const roomId = uuidv4();
      const memberId = uuidv4();

      // Create room
      const { error: roomError } = await supabase.from("rooms").insert({
        id: roomId,
        name: roomName.trim(),
        timer_duration: timerMinutes * 60,
        created_at: new Date().toISOString(),
      });

      if (roomError) throw roomError;

      // Add creator as member
      const { error: memberError } = await supabase.from("members").insert({
        id: memberId,
        room_id: roomId,
        name: displayName.trim(),
        user_id: userId,
        timer_remaining: timerMinutes * 60,
        is_paused: true,
        last_tick_at: new Date().toISOString(),
        joined_at: new Date().toISOString(),
      });

      if (memberError) throw memberError;

      navigate(`/room/${roomId}`);
    } catch (err) {
      console.error("Error creating room:", err);
      alert("Failed to create room. Check your Supabase connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinRoomId.trim() || !joinName.trim()) return;

    setLoading(true);
    try {
      const userId = getOrCreateUserId();
      setUserName(joinName.trim());

      // Extract room ID from URL or direct ID
      let roomId = joinRoomId.trim();
      if (roomId.includes("/room/")) {
        roomId = roomId.split("/room/").pop() || roomId;
      }

      // Check if room exists
      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (roomError || !room) {
        alert("Room not found. Check the room ID and try again.");
        setLoading(false);
        return;
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from("members")
        .select("id")
        .eq("room_id", roomId)
        .eq("user_id", userId)
        .single();

      if (!existingMember) {
        // Add as member
        const { error: memberError } = await supabase.from("members").insert({
          id: uuidv4(),
          room_id: roomId,
          name: joinName.trim(),
          user_id: userId,
          timer_remaining: room.timer_duration,
          is_paused: true,
          last_tick_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
        });

        if (memberError) throw memberError;
      }

      navigate(`/room/${roomId}`);
    } catch (err) {
      console.error("Error joining room:", err);
      alert("Failed to join room. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const presetTimers = [15, 25, 30, 45, 60, 90];

  return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100vh-8rem)]">
      {/* Hero */}
      <div className="mb-10 text-center animate-slide-up">
        <h1 className="mb-3 font-extrabold text-4xl sm:text-5xl tracking-tight">
          Focus <span className="gradient-text">Together</span>
        </h1>
        <p className="mx-auto max-w-md text-base text-zinc-500 sm:text-lg dark:text-zinc-400">
          Create a room, invite your peers, and stay focused with shared timers
          and goals.
        </p>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-md animate-slide-up"
        style={{ animationDelay: "0.1s" }}
      >
        {/* Tabs */}
        <div className="flex bg-zinc-100 dark:bg-zinc-800/50 mb-6 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("create")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
              activeTab === "create"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            Create Room
          </button>
          <button
            onClick={() => setActiveTab("join")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
              activeTab === "join"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            Join Room
          </button>
        </div>

        {/* Create Room Form */}
        {activeTab === "create" && (
          <form onSubmit={handleCreateRoom} className="space-y-5">
            <div>
              <label className="block mb-1.5 font-semibold text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Your Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                required
                className="bg-zinc-100 dark:bg-zinc-800/50 px-4 py-3 border border-zinc-200 focus:border-violet-500 dark:border-zinc-700/50 rounded-xl w-full text-sm text-zinc-800 dark:text-zinc-200 transition-all placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-semibold text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Room Name
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g. Morning Study Session"
                required
                className="bg-zinc-100 dark:bg-zinc-800/50 px-4 py-3 border border-zinc-200 focus:border-violet-500 dark:border-zinc-700/50 rounded-xl w-full text-sm text-zinc-800 dark:text-zinc-200 transition-all placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-semibold text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Timer Duration
              </label>
              <div className="gap-2 grid grid-cols-6 mb-2">
                {presetTimers.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setTimerMinutes(mins)}
                    className={`py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      timerMinutes === mins
                        ? "bg-violet-600 text-white shadow-lg shadow-violet-500/25"
                        : "bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
              <input
                type="range"
                min={5}
                max={120}
                step={5}
                value={timerMinutes}
                onChange={(e) => setTimerMinutes(Number(e.target.value))}
                className="w-full accent-violet-600"
              />
              <p className="mt-1 text-center text-sm text-zinc-500 dark:text-zinc-400">
                <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                  {timerMinutes}
                </span>{" "}
                minutes
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !roomName.trim() || !displayName.trim()}
              className="bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 disabled:shadow-none py-3.5 rounded-xl w-full font-bold text-sm text-white disabled:text-zinc-500 transition-all duration-200 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex justify-center items-center gap-2">
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating...
                </span>
              ) : (
                "Create Room"
              )}
            </button>
          </form>
        )}

        {/* Join Room Form */}
        {activeTab === "join" && (
          <form onSubmit={handleJoinRoom} className="space-y-5">
            <div>
              <label className="block mb-1.5 font-semibold text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Your Name
              </label>
              <input
                type="text"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                placeholder="Enter your name"
                required
                className="bg-zinc-100 dark:bg-zinc-800/50 px-4 py-3 border border-zinc-200 focus:border-violet-500 dark:border-zinc-700/50 rounded-xl w-full text-sm text-zinc-800 dark:text-zinc-200 transition-all placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-semibold text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Room ID or Link
              </label>
              <input
                type="text"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                placeholder="Paste room ID or link"
                required
                className="bg-zinc-100 dark:bg-zinc-800/50 px-4 py-3 border border-zinc-200 focus:border-violet-500 dark:border-zinc-700/50 rounded-xl w-full font-mono text-sm text-zinc-800 dark:text-zinc-200 transition-all placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !joinRoomId.trim() || !joinName.trim()}
              className="bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 disabled:shadow-none py-3.5 rounded-xl w-full font-bold text-sm text-white disabled:text-zinc-500 transition-all duration-200 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex justify-center items-center gap-2">
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Joining...
                </span>
              ) : (
                "Join Room"
              )}
            </button>
          </form>
        )}
      </div>

      {/* Footer */}
      <p className="mt-12 text-center text-xs text-zinc-400 dark:text-zinc-600">
        No account needed · Your data stays in the room · Built for deep focus
      </p>
    </div>
  );
}
