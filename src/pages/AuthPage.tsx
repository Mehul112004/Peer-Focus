import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function AuthPage() {
  const navigate = useNavigate();
  const { signup, login } = useAuth();

  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sign In fields
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Sign Up fields
  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupDisplayName, setSignupDisplayName] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!loginIdentifier.trim() || !loginPassword) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    const result = await login(loginIdentifier, loginPassword);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      navigate("/");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !signupUsername.trim() ||
      !signupEmail.trim() ||
      !signupDisplayName.trim() ||
      !signupPassword
    ) {
      setError("Please fill in all fields");
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (signupPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const result = await signup(
      signupUsername,
      signupEmail,
      signupPassword,
      signupDisplayName,
    );
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      navigate("/");
    }
  };

  const inputClass =
    "bg-zinc-100 dark:bg-zinc-800/50 px-4 py-3 border border-zinc-200 focus:border-violet-500 dark:border-zinc-700/50 rounded-xl w-full text-sm text-zinc-800 dark:text-zinc-200 transition-all placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50";

  const labelClass =
    "block mb-1.5 font-semibold text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider";

  return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100vh-8rem)]">
      {/* Hero */}
      <div className="mb-10 text-center animate-slide-up">
        <h1 className="mb-3 font-extrabold text-4xl sm:text-5xl tracking-tight">
          Welcome <span className="gradient-text">Back</span>
        </h1>
        <p className="mx-auto max-w-md text-base text-zinc-500 sm:text-lg dark:text-zinc-400">
          Sign in to access your focus rooms or create a new account
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
            onClick={() => {
              setActiveTab("signin");
              setError("");
            }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
              activeTab === "signin"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setActiveTab("signup");
              setError("");
            }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
              activeTab === "signup"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 mb-4 px-4 py-3 border border-red-200 dark:border-red-800/50 rounded-xl text-red-600 text-sm dark:text-red-400 animate-fade-in">
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.068 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            {error}
          </div>
        )}

        {/* Sign In Form */}
        {activeTab === "signin" && (
          <form onSubmit={handleSignIn} className="space-y-5">
            <div>
              <label className={labelClass}>Username or Email</label>
              <input
                type="text"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="Enter your username or email"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !loginIdentifier.trim() || !loginPassword}
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
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>

            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("signup");
                  setError("");
                }}
                className="font-semibold text-violet-600 dark:text-violet-400 hover:underline"
              >
                Sign Up
              </button>
            </p>
          </form>
        )}

        {/* Sign Up Form */}
        {activeTab === "signup" && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className={labelClass}>Username</label>
              <input
                type="text"
                value={signupUsername}
                onChange={(e) => setSignupUsername(e.target.value)}
                placeholder="Choose a username"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Display Name</label>
              <input
                type="text"
                value={signupDisplayName}
                onChange={(e) => setSignupDisplayName(e.target.value)}
                placeholder="How should we call you?"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Password</label>
              <input
                type="password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Confirm Password</label>
              <input
                type="password"
                value={signupConfirmPassword}
                onChange={(e) => setSignupConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={
                loading ||
                !signupUsername.trim() ||
                !signupEmail.trim() ||
                !signupDisplayName.trim() ||
                !signupPassword ||
                !signupConfirmPassword
              }
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
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>

            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("signin");
                  setError("");
                }}
                className="font-semibold text-violet-600 dark:text-violet-400 hover:underline"
              >
                Sign In
              </button>
            </p>
          </form>
        )}
      </div>

      {/* Footer */}
      <p className="mt-12 text-center text-xs text-zinc-400 dark:text-zinc-600">
        Your data is stored securely · Built for deep focus
      </p>
    </div>
  );
}
