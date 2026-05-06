import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

const Signup = () => {
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
      options: {
        data: {
          full_name: name,
        },
      },
    });

    console.log("SIGNUP RESPONSE:", data);
    console.log("SIGNUP ERROR:", error);

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    alert("Signup successful. Now login.");
    nav("/login");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <motion.div className="w-full max-w-md p-8 border rounded-xl">

        <h1 className="text-2xl font-semibold mb-6">Signup</h1>

        <form onSubmit={submit} className="space-y-4">

          <input
            placeholder="Full Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-10 px-3 border rounded"
          />

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
            {loading ? "Creating..." : "Signup"}
          </button>
        </form>

        <p className="text-sm mt-4">
          Already have account?{" "}
          <Link to="/login" className="text-yellow-500">
            Login
          </Link>
        </p>

      </motion.div>
    </div>
  );
};

export default Signup;