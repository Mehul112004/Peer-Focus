import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import RoomPage from "./pages/RoomPage";
import AuthPage from "./pages/AuthPage";
import { ThemeProvider } from "./components/ThemeProvider";
import ThemeToggle from "./components/ThemeToggle";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="top-0 z-40 sticky bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-zinc-200/50 dark:border-zinc-800/50 border-b">
      <div className="flex justify-between items-center mx-auto px-4 sm:px-6 max-w-6xl h-16">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
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

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-3">
              <div className="sm:flex items-center gap-2 hidden bg-zinc-100 dark:bg-zinc-800/50 px-3 py-1.5 rounded-lg">
                <div className="flex justify-center items-center bg-violet-600 rounded-full w-6 h-6">
                  <span className="font-bold text-white text-xs">
                    {user.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="font-medium text-sm text-zinc-700 dark:text-zinc-300">
                  {user.display_name}
                </span>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate("/auth");
                }}
                className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-3 py-1.5 rounded-lg font-medium text-sm text-zinc-600 dark:text-zinc-400 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-500/25 px-4 py-1.5 rounded-lg font-semibold text-sm text-white transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

function AppContent() {
  return (
    <div className="bg-white dark:bg-zinc-950 min-h-screen text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      <BrowserRouter>
        <Navbar />
        <main className="mx-auto px-4 sm:px-6 py-8 max-w-6xl">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/room/:id" element={<RoomPage />} />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
