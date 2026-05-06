import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchRuns } from "@/lib/api";

const statusConfig: Record<string, { color: string; dot: string; bg: string }> = {
  done: {
    color: "text-emerald-400",
    dot: "bg-emerald-400",
    bg: "bg-emerald-400/10 border-emerald-400/20",
  },
  running: {
    color: "text-amber-400",
    dot: "bg-amber-400 animate-pulse",
    bg: "bg-amber-400/10 border-amber-400/20",
  },
  failed: {
    color: "text-red-400",
    dot: "bg-red-400",
    bg: "bg-red-400/10 border-red-400/20",
  },
  pending: {
    color: "text-gray-400",
    dot: "bg-gray-400",
    bg: "bg-gray-400/10 border-gray-400/20",
  },
};

const getStatusConfig = (status: string) =>
  statusConfig[status?.toLowerCase()] || statusConfig.pending;

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const RunCard = ({ run, onClick }: { run: any; onClick: () => void }) => {
  const cfg = getStatusConfig(run.status);
  const progress = run.progress ?? 0;

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col gap-3 p-5 rounded-xl border border-gray-700/60 bg-gray-800/40 hover:bg-gray-800/80 hover:border-gray-600 cursor-pointer transition-all duration-200"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
            {run.topic}
          </h2>
          {run.created_at && (
            <p className="text-xs text-gray-500 mt-0.5">{formatDate(run.created_at)}</p>
          )}
        </div>

        {/* Status badge */}
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color} shrink-0`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {run.status?.toUpperCase()}
        </span>
      </div>

      {/* Stage & ID row */}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        {run.id && (
          <span className="font-mono bg-gray-700/50 px-2 py-0.5 rounded text-gray-300">
            #{String(run.id).slice(0, 8)}
          </span>
        )}
        {run.current_stage && (
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {run.current_stage}
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Progress</span>
          <span className="font-medium text-white">{progress}%</span>
        </div>
        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              run.status?.toLowerCase() === "done"
                ? "bg-emerald-500"
                : run.status?.toLowerCase() === "failed"
                ? "bg-red-500"
                : run.status?.toLowerCase() === "running"
                ? "bg-blue-500"
                : "bg-gray-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Action hint */}
      {run.status?.toLowerCase() === "done" && (
        <div className="flex gap-2 pt-1 border-t border-gray-700/50">
          <span className="text-xs text-blue-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Report
          </span>
          <span className="text-xs text-purple-400 flex items-center gap-1 ml-3">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            RAG Chat
          </span>
        </div>
      )}
    </div>
  );
};

const Runs = () => {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const navigate = useNavigate();

  useEffect(() => {
    const loadRuns = async () => {
      try {
        const data = await fetchRuns();
        const runsData = Array.isArray(data) ? data : data.runs || [];
        setRuns(runsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadRuns();
    const interval = setInterval(loadRuns, 3000);
    return () => clearInterval(interval);
  }, []);

  const statuses = ["all", "done", "running", "failed", "pending"];
  const filtered =
    filter === "all" ? runs : runs.filter((r) => r.status?.toLowerCase() === filter);

  const counts = statuses.reduce((acc, s) => {
    acc[s] = s === "all" ? runs.length : runs.filter((r) => r.status?.toLowerCase() === s).length;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex gap-2 items-center text-gray-400">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Loading runs...
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto text-white">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Research Runs</h1>
        <p className="text-sm text-gray-400 mt-1">{runs.length} total runs</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 bg-gray-800/60 p-1 rounded-lg w-fit">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              filter === s
                ? "bg-gray-600 text-white shadow"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            {counts[s] > 0 && (
              <span className="ml-1.5 text-[10px] bg-gray-700 px-1.5 py-0.5 rounded-full">
                {counts[s]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm">No {filter === "all" ? "" : filter} runs found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((run) => (
            <RunCard
              key={run.id}
              run={run}
              onClick={() => navigate(`/runs/${run.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Runs;