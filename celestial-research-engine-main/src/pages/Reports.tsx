import { useEffect, useState } from "react";
import axios from "axios";

const Reports = () => {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await axios.get("http://localhost:8000/runs");

        // only completed/done runs
        const completed = res.data.filter(
          (r: any) => r.status === "done"
        );

        setReports(completed);
      } catch (err) {
        console.error(err);
      }
    };

    fetchReports();
  }, []);

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl mb-4">Reports</h1>

      {reports.length === 0 ? (
        <p>No completed reports</p>
      ) : (
        reports.map((r) => (
          <div
            key={r.id}
            className="bg-white/5 p-4 rounded mb-3"
          >
            <p className="font-medium">{r.topic}</p>

            <div className="flex gap-3 mt-2">

              <a
                href={`/report/${r.id}`}
                className="bg-blue-600 px-3 py-1 rounded"
              >
                View
              </a>

              <a
                href={`http://localhost:8000/reports/${r.id}/download`}
                className="bg-green-600 px-3 py-1 rounded"
              >
                Download
              </a>

            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Reports;