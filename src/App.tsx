import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import RoomPage from "./pages/RoomPage";
import { ThemeProvider } from "./components/ThemeProvider";
import ThemeToggle from "./components/ThemeToggle";

function App() {
  return (
    <ThemeProvider>
      <div className="bg-white dark:bg-zinc-950 min-h-screen text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
        {/* Navigation */}
        <nav className="top-0 z-40 sticky bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-zinc-200/50 dark:border-zinc-800/50 border-b">
          <div className="flex justify-between items-center mx-auto px-4 sm:px-6 max-w-6xl h-16">
            <div className="flex items-center gap-2">
              <div className="flex justify-center items-center bg-violet-600 shadow-lg shadow-violet-500/30 rounded-xl w-8 h-8">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <span className="bg-clip-text bg-linear-to-r from-zinc-900 dark:from-white to-zinc-600 dark:to-zinc-400 font-bold text-lg text-transparent tracking-tight">
                PeerFocus
              </span>
            </div>
            <ThemeToggle />
          </div>
        </nav>

        {/* Main Content */}
        <main className="mx-auto px-4 sm:px-6 py-8 max-w-6xl">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/room/:id" element={<RoomPage />} />
            </Routes>
          </BrowserRouter>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
