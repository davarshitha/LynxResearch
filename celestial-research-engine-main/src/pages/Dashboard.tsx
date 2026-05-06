import { useEffect, useState } from "react";
import axios from "axios";

const Dashboard = () => {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRuns = async () => {
    try {
      const res = await axios.get("http://localhost:8000/runs/");
      console.log("RUNS:", res.data); // 🔥 debug
      setRuns(res.data);
    } catch (err) {
      console.error("Failed to fetch runs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();

    // 🔄 auto refresh (important for pipeline updates)
    const interval = setInterval(fetchRuns, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <p className="text-white p-4">Loading...</p>;

  const recentRuns = runs.slice(0, 5);

  return (
    <div className="p-6 text-white">

      <h2 className="text-2xl mb-4">Recent Runs</h2>

      {recentRuns.length === 0 ? (
        <p className="text-zinc-400">No runs yet</p>
      ) : (
        <div className="space-y-3">
          {recentRuns.map((run) => (
            <div
              key={run.id}
              className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg"
            >
              <div className="flex justify-between">

                {/* ✅ IMPORTANT: topic NOT title */}
                <h3 className="font-medium">{run.topic}</h3>

                <span className="text-sm text-zinc-400">
                  {run.status}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-2 h-2 bg-zinc-800 rounded">
                <div
                  className="h-full bg-yellow-500 rounded"
                  style={{ width: `${run.progress}%` }}
                />
              </div>

              <div className="text-xs text-zinc-500 mt-1">
                {new Date(run.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;