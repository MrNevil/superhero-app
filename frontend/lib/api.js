// API helper functions - these simplify fetching data from the backend

// Determine API base URL based on environment
const API_BASE = typeof window === "undefined" 
  ? "http://backend:8000"  // Server-side (inside Docker)
  : "http://localhost:8000"; // Client-side (browser)

// GET request - fetch data from server
export async function apiGet(path) {
  const response = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Request failed");
  }
  return response.json();
}

// POST request - send data to server
export async function apiPost(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!response.ok) {
    throw new Error("Request failed");
  }
  return response.json();
}

// DELETE request - remove data from server
export async function apiDelete(path) {
  const response = await fetch(`${API_BASE}${path}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error("Request failed");
  }
  return response.json();
}
