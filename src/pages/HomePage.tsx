import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { getOrCreateUserId, getUserName, setUserName } from "@/lib/user";
import { useAuth } from "@/context/AuthContext";
import { v4 as uuidv4 } from "uuid";

interface UserRoom {
  room_id: string;
  room_name: string;
  joined_at: string;
  member_count: number;
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [roomName, setRoomName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [joinRoomId, setJoinRoomId] = useState("");
  const [joinName, setJoinName] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [userRooms, setUserRooms] = useState<UserRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name);
      setJoinName(user.display_name);
    } else {
      const name = getUserName();
      if (name) {
        setDisplayName(name);
        setJoinName(name);
      }
    }
  }, [user]);

  // Fetch user's rooms when logged in
  useEffect(() => {
    if (!user) {
      setUserRooms([]);
      return;
    }

    const fetchUserRooms = async () => {
      setRoomsLoading(true);
      try {
        // Get member entries for this user
        const { data: memberEntries, error: memberError } = await supabase
          .from("members")
          .select("room_id, joined_at")
          .eq("user_id", user.id)
          .order("joined_at", { ascending: false });

        if (memberError || !memberEntries?.length) {
          setUserRooms([]);
          setRoomsLoading(false);
          return;
        }

        const roomIds = memberEntries.map((m) => m.room_id);

        // Get room details
        const { data: rooms, error: roomError } = await supabase
          .from("rooms")
          .select("id, name")
          .in("id", roomIds);

        if (roomError) throw roomError;

        // Get member counts for each room
        const { data: allMembers, error: countError } = await supabase
          .from("members")
          .select("room_id")
          .in("room_id", roomIds);

        if (countError) throw countError;

        const countMap: Record<string, number> = {};
        allMembers?.forEach((m) => {
          countMap[m.room_id] = (countMap[m.room_id] || 0) + 1;
        });

        const result: UserRoom[] = memberEntries.map((entry) => {
          const room = rooms?.find((r) => r.id === entry.room_id);
          return {
            room_id: entry.room_id,
            room_name: room?.name || "Unknown Room",
            joined_at: entry.joined_at,
            member_count: countMap[entry.room_id] || 1,
          };
        });

        setUserRooms(result);
      } catch (err) {
        console.error("Error fetching user rooms:", err);
      } finally {
        setRoomsLoading(false);
      }
    };

    fetchUserRooms();
  }, [user]);

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

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const presetTimers = [15, 25, 30, 45, 60, 90];

  return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100vh-8rem)]">
      {/* Hero */}
      <div className="mb-10 text-center animate-slide-up">
        <h1 className="mb-3 font-extrabold text-4xl sm:text-5xl tracking-tight">
          {user ? (
            <>
              Hey, <span className="gradient-text">{user.display_name}</span>
            </>
          ) : (
            <>
              Focus <span className="gradient-text">Together</span>
            </>
          )}
        </h1>
        <p className="mx-auto max-w-md text-base text-zinc-500 sm:text-lg dark:text-zinc-400">
          {user
            ? "Your focus rooms are waiting. Create a new one or rejoin an existing session."
            : "Create a room, invite your peers, and stay focused with shared timers and goals."}
        </p>
      </div>

      {/* User's Rooms (when logged in) */}
      {user && (
        <div
          className="mb-8 w-full max-w-2xl animate-slide-up"
          style={{ animationDelay: "0.05s" }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
              Your Rooms
            </h2>
            {userRooms.length > 0 && (
              <span className="font-medium text-xs text-zinc-400 dark:text-zinc-500">
                {userRooms.length} room{userRooms.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {roomsLoading ? (
            <div className="flex justify-center py-8">
              <div className="border-4 border-violet-500/30 border-t-violet-600 rounded-full w-6 h-6 animate-spin" />
            </div>
          ) : userRooms.length === 0 ? (
            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-8 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl text-center">
              <div className="flex justify-center mb-3">
                <svg
                  className="w-10 h-10 text-zinc-300 dark:text-zinc-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                  />
                </svg>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No rooms yet. Create your first one below!
              </p>
            </div>
          ) : (
            <div className="gap-3 grid grid-cols-1 sm:grid-cols-2">
              {userRooms.map((room) => (
                <button
                  key={room.room_id}
                  onClick={() => navigate(`/room/${room.room_id}`)}
                  className="group bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/50 dark:hover:bg-zinc-800/60 p-4 border border-zinc-200/50 hover:border-violet-300 dark:border-zinc-800/50 dark:hover:border-violet-500/30 rounded-2xl text-left transition-all duration-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="mr-2 font-semibold text-sm text-zinc-900 dark:group-hover:text-violet-400 dark:text-zinc-100 group-hover:text-violet-600 truncate transition-colors">
                      {room.room_name}
                    </h3>
                    <svg
                      className="mt-0.5 w-4 h-4 text-zinc-400 group-hover:text-violet-500 transition-colors shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500">
                    <span className="flex items-center gap-1">
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
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {room.member_count} peer
                      {room.member_count !== 1 ? "s" : ""}
                    </span>
                    <span>·</span>
                    <span>{formatTimeAgo(room.joined_at)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Card */}
      <div
        className="w-full max-w-md animate-slide-up"
        style={{ animationDelay: user ? "0.15s" : "0.1s" }}
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
        {activeTab === "create" && !user && (
          <div className="flex flex-col items-center space-y-4 py-8 text-center">
            <div className="flex justify-center items-center bg-violet-100 dark:bg-violet-900/30 rounded-full w-14 h-14">
              <svg
                className="w-7 h-7 text-violet-600 dark:text-violet-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            </div>
            <div>
              <h3 className="mb-1 font-bold text-lg text-zinc-900 dark:text-zinc-100">
                Sign in to create a room
              </h3>
              <p className="mx-auto max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
                Create an account or sign in to start your own focus sessions
                and track your rooms.
              </p>
            </div>
            <button
              onClick={() => navigate("/auth")}
              className="bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 px-8 py-3 rounded-xl font-bold text-sm text-white transition-all duration-200"
            >
              Sign In / Sign Up
            </button>
          </div>
        )}

        {activeTab === "create" && user && (
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
                disabled={!!user}
                className={`bg-zinc-100 dark:bg-zinc-800/50 px-4 py-3 border border-zinc-200 focus:border-violet-500 dark:border-zinc-700/50 rounded-xl w-full text-sm text-zinc-800 dark:text-zinc-200 transition-all placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 ${user ? "opacity-60 cursor-not-allowed" : ""}`}
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
                disabled={!!user}
                className={`bg-zinc-100 dark:bg-zinc-800/50 px-4 py-3 border border-zinc-200 focus:border-violet-500 dark:border-zinc-700/50 rounded-xl w-full text-sm text-zinc-800 dark:text-zinc-200 transition-all placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 ${user ? "opacity-60 cursor-not-allowed" : ""}`}
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
        {user
          ? `Signed in as ${user.username} · Built for deep focus`
          : "No account needed · Your data stays in the room · Built for deep focus"}
      </p>
    </div>
  );
}
