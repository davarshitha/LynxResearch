import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const ReportViewer = () => {
  const { id } = useParams();
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/reports/${id}/markdown`
        );

        setReport(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  if (loading) return <p className="text-white p-6">Loading report...</p>;

  if (!report)
    return <p className="text-red-400 p-6">Report not ready</p>;

  return (
    <div className="p-6 text-white max-w-4xl mx-auto whitespace-pre-wrap">
      {report}
    </div>
  );
};

export default ReportViewer;