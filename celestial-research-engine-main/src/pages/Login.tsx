import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

const Login = () => {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    console.log("LOGIN RESPONSE:", data);
    console.log("LOGIN ERROR:", error);

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    nav("/dashboard");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-md p-8 border rounded-xl"
      >
        <h1 className="text-2xl font-semibold mb-6">Login</h1>

        <form onSubmit={submit} className="space-y-4">

          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-10 px-3 border rounded"
          />

          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-10 px-3 border rounded"
          />

          {errorMsg && (
            <p className="text-red-500 text-sm">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-yellow-500 rounded"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="text-sm mt-4">
          New user?{" "}
          <Link to="/signup" className="text-yellow-500">
            Signup
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;