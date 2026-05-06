import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getRunById, getRunProgress } from "@/lib/api";

const statusConfig: Record<string, { color: string; bg: string; border: string; dot: string }> = {
  done: {
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/30",
    dot: "bg-emerald-400",
  },
  running: {
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/30",
    dot: "bg-amber-400 animate-pulse",
  },
  failed: {
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/30",
    dot: "bg-red-400",
  },
  pending: {
    color: "text-gray-400",
    bg: "bg-gray-400/10",
    border: "border-gray-400/30",
    dot: "bg-gray-400",
  },
};

const getStatusConfig = (status: string) =>
  statusConfig[status?.toLowerCase()] || statusConfig.pending;

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-IN", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-700/50 last:border-0">
    <span className="text-sm text-gray-400 shrink-0">{label}</span>
    <span className="text-sm text-white text-right font-medium">{value}</span>
  </div>
);

const RunDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [run, setRun] = useState<any>(null);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const data = await getRunById(id);
        setRun(data);
      } catch (err) {
        console.error(err);
      }
    };

    load();

    const interval = setInterval(async () => {
      try {
        const progress = await getRunProgress(id);
        setRun((prev: any) => ({ ...prev, ...progress }));
      } catch {}
    }, 3000);

    return () => clearInterval(interval);
  }, [id]);

  if (!run) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex gap-2 items-center text-gray-400">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Loading run details...
        </div>
      </div>
    );
  }

  const cfg = getStatusConfig(run.status);
  const progress = run.progress ?? 0;
  const isDone = run.status?.toLowerCase() === "done";
  const isRunning = run.status?.toLowerCase() === "running";

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto text-white">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Research Runs
      </button>

      {/* Title block */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-semibold tracking-tight flex-1">{run.topic}</h1>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${cfg.bg} ${cfg.border} ${cfg.color}`}
          >
            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            {run.status?.toUpperCase()}
          </span>
        </div>
        {run.id && (
          <p className="text-xs font-mono text-gray-500 mt-2">Run ID: {run.id}</p>
        )}
      </div>

      {/* Progress card */}
      <div className="rounded-xl border border-gray-700/60 bg-gray-800/40 p-5 mb-5">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-gray-400">Overall Progress</span>
          <span className={`text-2xl font-bold ${isDone ? "text-emerald-400" : "text-white"}`}>
            {progress}%
          </span>
        </div>

        <div className="h-2.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isDone
                ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                : run.status?.toLowerCase() === "failed"
                ? "bg-red-500"
                : "bg-gradient-to-r from-blue-600 to-blue-400"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {isRunning && run.current_stage && (
          <p className="text-xs text-amber-400 mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
            Currently: {run.current_stage}
          </p>
        )}
      </div>

      {/* Details card */}
      <div className="rounded-xl border border-gray-700/60 bg-gray-800/40 p-5 mb-5">
        <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
          Run Details
        </h2>
        <InfoRow label="Topic" value={run.topic} />
        <InfoRow label="Status" value={
          <span className={cfg.color}>{run.status}</span>
        } />
        {run.current_stage && (
          <InfoRow label="Current Stage" value={run.current_stage} />
        )}
        {run.created_at && (
          <InfoRow label="Created" value={formatDate(run.created_at)} />
        )}
        {run.updated_at && (
          <InfoRow label="Last Updated" value={formatDate(run.updated_at)} />
        )}
        {run.model && (
          <InfoRow label="Model" value={
            <span className="font-mono text-xs bg-gray-700 px-2 py-0.5 rounded">{run.model}</span>
          } />
        )}
        {run.num_sources !== undefined && (
          <InfoRow label="Sources Found" value={run.num_sources} />
        )}
        {run.error && (
          <InfoRow label="Error" value={
            <span className="text-red-400 text-xs">{run.error}</span>
          } />
        )}
      </div>

      {/* Action buttons — only when done */}
      {isDone && (
        <div className="rounded-xl border border-gray-700/60 bg-gray-800/40 p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
            Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <a
              href={`/report/${run.id}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View Report
            </a>

            <a
              href={`http://localhost:8000/reports/${run.id}/download`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </a>

            <a
              href={`/chats/${run.id}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              RAG Chat
            </a>
          </div>
        </div>
      )}

      {/* Running state notice */}
      {isRunning && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-400/20 bg-amber-400/5 text-amber-400 text-sm">
          <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shrink-0" />
          Research is in progress. This page auto-refreshes every 3 seconds.
        </div>
      )}
    </div>
  );
};

export default RunDetail;