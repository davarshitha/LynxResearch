import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const Settings = () => {
  const [user, setUser] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        window.location.href = "/login";
        return;
      }

      setUser(data.user);
      setName(data.user.user_metadata?.full_name || "");
    };

    getUser();
  }, []);

  const updateProfile = async () => {
    const { error } = await supabase.auth.updateUser({
      data: { full_name: name },
    });

    if (error) return alert(error.message);

    setEditing(false);
  };

  const changePassword = async () => {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) return alert(error.message);

    alert("Password updated");
    setPassword("");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (!user) return <p className="p-8 text-white">Loading...</p>;

  return (
    <div className="p-8 max-w-3xl mx-auto text-white">

      <h1 className="text-3xl mb-6">Settings</h1>

      {/* PROFILE */}
      <div className="bg-zinc-900 p-6 rounded-xl mb-6">
        <h2 className="text-xl mb-4">Profile</h2>

        <input
          value={name}
          disabled={!editing}
          onChange={(e) => setName(e.target.value)}
          className="w-full mb-3 px-3 py-2 rounded bg-zinc-800 border border-zinc-700"
        />

        <p className="text-zinc-400 mb-3">{user.email}</p>

        {!editing ? (
          <button onClick={() => setEditing(true)} className="bg-yellow-500 text-black px-4 py-2 rounded">
            Edit
          </button>
        ) : (
          <button onClick={updateProfile} className="bg-green-500 px-4 py-2 rounded">
            Save
          </button>
        )}
      </div>

      {/* PASSWORD */}
      <div className="bg-zinc-900 p-6 rounded-xl mb-6">
        <h2 className="text-xl mb-4">Security</h2>

        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-3 px-3 py-2 rounded bg-zinc-800 border border-zinc-700"
        />

        <button onClick={changePassword} className="bg-yellow-500 text-black px-4 py-2 rounded">
          Change Password
        </button>
      </div>

      {/* LOGOUT */}
      <div className="bg-zinc-900 p-6 rounded-xl">
        <h2 className="text-xl mb-4">Account</h2>

        <button onClick={logout} className="bg-red-500 px-4 py-2 rounded">
          Logout
        </button>
      </div>

    </div>
  );
};

export default Settings;