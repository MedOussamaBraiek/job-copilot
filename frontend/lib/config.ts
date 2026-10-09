const LIVE_API_BASE = "https://job-copilot-backend-wy06.onrender.com";
const LOCAL_API_BASE = "http://localhost:8000";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "production" ? LIVE_API_BASE : LOCAL_API_BASE);
export const API = `${API_BASE}/api/applications`;
