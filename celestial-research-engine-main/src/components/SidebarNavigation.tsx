import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FlaskConical,
  FileText,
  Database,
  BarChart3,
  MessagesSquare,
  Settings,
  Plus,
  ChevronDown,
  CircleDot,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import { LynxMark } from "./Brand";
import { ThemeToggle } from "./ThemeToggle";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import axios from "axios";
import { supabase } from "../lib/supabase";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/runs", label: "Research Runs", icon: FlaskConical },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/sources", label: "Sources", icon: Database },
  { to: "/visualizations", label: "Visualizations", icon: BarChart3 },
  { to: "/chats", label: "RAG Chats", icon: MessagesSquare },
  { to: "/settings", label: "Settings", icon: Settings },
];

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

export function SidebarNavigation({ collapsed, onToggle }: Props) {
  const { pathname } = useLocation();
  const [wsOpen, setWsOpen] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [runs, setRuns] = useState<any[]>([]);

  useEffect(() => {
    // 🔐 Get user
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    // 📊 Get real runs
    axios
      .get("http://localhost:8000/runs")
      .then((res) => {
        const data = Array.isArray(res.data)
          ? res.data
          : res.data.runs || [];
        setRuns(data);
      })
      .catch(console.error);
  }, []);

  return (
    <aside
      className={`hidden lg:flex flex-col h-screen sticky top-0 border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl transition-[width] duration-300 ${
        collapsed ? "w-[68px]" : "w-[260px]"
      }`}
    >
      {/* HEADER */}
      <div className="px-3 pt-4 pb-3 border-b border-sidebar-border/60">
        <div className="flex items-center justify-between">
          {collapsed ? (
            <NavLink to="/dashboard" className="mx-auto">
              <LynxMark size={26} />
            </NavLink>
          ) : (
            <button
              onClick={() => setWsOpen((v) => !v)}
              className="flex items-center gap-2 flex-1 px-2 py-1.5 rounded-lg hover:bg-sidebar-accent/50 transition"
            >
              <LynxMark size={24} />
              <div className="flex-1 text-left min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Workspace
                </div>
                <div className="text-sm font-medium truncate">
                  LynxResearch
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}

          <button
            onClick={onToggle}
            className="ml-1 h-7 w-7 rounded-md hover:bg-sidebar-accent/60 flex items-center justify-center"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-3.5 w-3.5" />
            ) : (
              <PanelLeftClose className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* NEW RESEARCH */}
      <div className="p-3">
        <NavLink
          to="/new"
          className="flex items-center gap-2 w-full bg-yellow-500 text-black rounded-lg px-3 py-2.5"
        >
          <Plus className="h-4 w-4" />
          {!collapsed && <span>New Research</span>}
        </NavLink>
      </div>

      {/* NAV */}
      <nav className="flex-1 overflow-y-auto px-2">
        {nav.map((item) => {
          const active =
            pathname === item.to ||
            (item.to === "/runs" && pathname.startsWith("/runs"));

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                active
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}

        {/* REAL RECENT RUNS */}
        {!collapsed && (
          <div className="mt-6">
            <div className="text-xs text-gray-400 mb-2 px-2">
              Recent Runs
            </div>

            {runs.slice(0, 5).map((r) => (
              <NavLink
                key={r.id}
                to={`/runs/${r.id}`}
                className="flex items-start gap-2 px-2 py-1.5 rounded text-xs hover:bg-white/10"
              >
                <CircleDot
                  className={`h-3 w-3 ${
                    r.status === "running"
                      ? "text-yellow-400"
                      : r.status === "done"
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                />
                <span>{r.topic}</span>
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* USER */}
      <div className="border-t p-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center text-black">
            {(user?.email || "U")[0].toUpperCase()}
          </div>

          {!collapsed && (
            <div>
              <div className="text-sm text-white">
                {user?.user_metadata?.full_name || user?.email}
              </div>
              <div className="text-xs text-gray-400">
                {user?.email}
              </div>
            </div>
          )}

          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}