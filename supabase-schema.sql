-- Peer Focus App — Supabase Schema
-- Run this in Supabase SQL Editor to create the required tables

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  timer_duration INTEGER NOT NULL DEFAULT 1500,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  user_id TEXT NOT NULL,
  timer_remaining INTEGER NOT NULL DEFAULT 1500,
  is_paused BOOLEAN NOT NULL DEFAULT true,
  last_tick_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_members_room_id ON members(room_id);
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_room_id ON goals(room_id);
CREATE INDEX IF NOT EXISTS idx_goals_member_id ON goals(member_id);

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE members;
ALTER PUBLICATION supabase_realtime ADD TABLE goals;

-- Disable RLS (no auth required)
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations (no auth)
CREATE POLICY "Allow all on rooms" ON rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on members" ON members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on goals" ON goals FOR ALL USING (true) WITH CHECK (true);
