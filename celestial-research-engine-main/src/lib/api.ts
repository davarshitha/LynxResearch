import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// RUNS
export const fetchRuns = async () => {
  const res = await API.get("/runs/");
  return res.data;
};

export const createRun = async (data: any) => {
  const res = await API.post("/runs/", data);
  return res.data;
};

export const getRunById = async (id: string) => {
  const res = await API.get(`/runs/${id}`);
  return res.data;
};

export const getRunProgress = async (id: string) => {
  const res = await API.get(`/runs/${id}/progress`);
  return res.data;
};

// REPORTS
export const getReport = async (id: string) => {
  const res = await API.get(`/reports/${id}`);
  return res.data;
};

// CHAT
export const sendChat = async (id: string, message: any) => {
  const res = await API.post(`/chat/${id}`, message);
  return res.data;
};

export default API;