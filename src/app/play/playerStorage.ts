export type StoredPlayer = { playerId: string; name: string };

function storageKey(code: string) {
  return `hae:player:${code.toUpperCase()}`;
}

export function storePlayer(code: string, playerId: string, name: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(code), JSON.stringify({ playerId, name }));
}

export function loadPlayer(code: string): StoredPlayer | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(storageKey(code));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredPlayer;
  } catch {
    return null;
  }
}
