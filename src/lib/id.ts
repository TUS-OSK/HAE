const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I/O to avoid 1/0 confusion

export function generateRoomCode(): string {
  return Array.from(
    { length: 4 },
    () => ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)]
  ).join("");
}

export function generatePlayerId(): string {
  return crypto.randomUUID();
}
