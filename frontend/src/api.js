// api.js — thin wrapper around the Life RPG backend.
// Keeps token handling + fetch boilerplate in one place.

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function getToken() {
  return localStorage.getItem("questline_token");
}

export function setToken(token) {
  if (token) localStorage.setItem("questline_token", token);
  else localStorage.removeItem("questline_token");
}

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Can't reach the server. Check your connection and try again.");
  }

  let data = {};
  try {
    data = await res.json();
  } catch {
    // no body / non-json response
  }

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  signup: (payload) => request("/api/auth/signup", { method: "POST", body: payload }),
  login: (payload) => request("/api/auth/login", { method: "POST", body: payload }),
  me: () => request("/api/me"),
  listTasks: () => request("/api/tasks"),
  createTask: (payload) => request("/api/tasks", { method: "POST", body: payload }),
  updateTask: (id, payload) => request(`/api/tasks/${id}`, { method: "PUT", body: payload }),
  deleteTask: (id) => request(`/api/tasks/${id}`, { method: "DELETE" }),
  completeTask: (id) => request(`/api/tasks/${id}/complete`, { method: "POST" }),
  shop: () => request("/api/shop"),
  buyItem: (id) => request(`/api/shop/${id}/buy`, { method: "POST" }),
  getStats: () => request("/api/stats"),
  updateAvatar: (avatarUrl) => request("/api/user/avatar", { method: "PUT", body: { avatar_url: avatarUrl } }),
};
