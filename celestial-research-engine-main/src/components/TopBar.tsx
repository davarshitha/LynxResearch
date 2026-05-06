import { Bell, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function TopBar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b bg-black/40 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-4 lg:px-6 h-14">

        {/* SEARCH */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              placeholder="Search..."
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-gray-800 text-white"
            />
          </div>
        </div>

        {/* USER */}
        <div className="text-right">
          <div className="text-white text-sm">
            {user?.user_metadata?.full_name || user?.email || "User"}
          </div>
          <div className="text-gray-400 text-xs">
            {user?.email}
          </div>
        </div>

        {/* NOTIFICATION */}
        <button className="relative h-9 w-9 rounded-lg bg-gray-800 flex items-center justify-center">
          <Bell className="h-4 w-4 text-white" />
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 h-2 w-2 bg-yellow-500 rounded-full"
          />
        </button>
      </div>
    </header>
  );
}