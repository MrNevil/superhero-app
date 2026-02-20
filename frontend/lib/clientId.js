export function getClientId() {
  if (typeof window === "undefined") {
    return "";
  }

  const key = "hero_atlas_client_id";
  const existing = window.localStorage.getItem(key);
  if (existing) {
    return existing;
  }

  const id = window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `client_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  window.localStorage.setItem(key, id);
  return id;
}
