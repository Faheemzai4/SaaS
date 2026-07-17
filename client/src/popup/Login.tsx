import { useState } from "react";
import { supabase } from "./supabase";

interface Props {
  onLogin(): void;
}

export default function Login({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login() {
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    onLogin();
  }

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">Login</h1>

      <input
        placeholder="Email"
        className="w-full rounded border p-2"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        className="w-full rounded border p-2"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={login}
        disabled={loading}
        className="w-full rounded bg-blue-600 py-2 text-white"
      >
        {loading ? "Signing in..." : "Login"}
      </button>

      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
