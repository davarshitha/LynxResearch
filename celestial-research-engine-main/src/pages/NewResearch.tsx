import { useState } from "react";
import { createRun } from "@/lib/api";
import { useNavigate } from "react-router-dom";

const NewResearch = () => {
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState("general");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!topic) return;

    setLoading(true);
    try {
      const res = await createRun({
        topic,
        style,
      });

      console.log("Created run:", res);

      navigate("/runs");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">New Research</h1>

      {/* Topic */}
      <textarea
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="Enter research topic..."
        className="w-full border p-4 rounded-lg mb-4 bg-white text-black placeholder-gray-500"
        rows={5}
      />

      {/* Report Type */}
      <select
        value={style}
        onChange={(e) => setStyle(e.target.value)}
        className="w-full border p-3 rounded-lg mb-6 bg-white text-black"
      >
        <option value="general">General</option>
        <option value="technical">Technical</option>
        <option value="medical">Medical</option>
        <option value="academic">Academic</option>
        <option value="business">Business</option>
        <option value="policy">Policy</option>
      </select>

      {/* Button */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg w-full"
      >
        {loading ? "Creating..." : "Start Research"}
      </button>
    </div>
  );
};

export default NewResearch;