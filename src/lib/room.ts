import { getKV } from "./kv";
import { generateRoomCode, generatePlayerId } from "./id";
import { generateAcronym, pickRandomTheme, checkInitials, getTheme } from "./acronym";

const ROOM_TTL_SECONDS = 6 * 60 * 60; // 6 hours idle expiry
const WRITING_MS = 75_000;
const VOTING_MS = 30_000;
const MIN_ACRONYM_LEN = 3;
const MAX_ACRONYM_LEN = 5;

export type Player = {
  id: string;
  name: string;
  score: number;
  joinedAt: number;
};

export type Submission = {
  playerId: string;
  text: string;
  submittedAt: number;
};

export type Vote = {
  voterId: string;
  targetPlayerId: string;
};

export type RoundRecord = {
  round: number;
  acronym: string;
  themeId: string;
  submissions: Submission[];
  tally: Record<string, number>;
};

export type RoomPhase = "lobby" | "writing" | "voting" | "results" | "ended";

export type Room = {
  code: string;
  hostId: string;
  createdAt: number;
  updatedAt: number;
  phase: RoomPhase;
  round: number;
  maxRounds: number;
  players: Player[];
  currentAcronym: string | null;
  currentThemeId: string | null;
  submissions: Submission[];
  votes: Vote[];
  deadline: number | null;
  history: RoundRecord[];
};

function key(code: string) {
  return `hae:room:${code.toUpperCase()}`;
}

async function save(room: Room): Promise<Room> {
  room.updatedAt = Date.now();
  await getKV().set(key(room.code), room, ROOM_TTL_SECONDS);
  return room;
}

function startRoundState(room: Room): Room {
  room.round += 1;
  room.currentAcronym = generateAcronym(
    MIN_ACRONYM_LEN + Math.floor(Math.random() * (MAX_ACRONYM_LEN - MIN_ACRONYM_LEN + 1))
  );
  room.currentThemeId = pickRandomTheme().id;
  room.submissions = [];
  room.votes = [];
  room.phase = "writing";
  room.deadline = Date.now() + WRITING_MS;
  return room;
}

function finishVotingIntoResults(room: Room): Room {
  const tally: Record<string, number> = {};
  for (const v of room.votes) {
    tally[v.targetPlayerId] = (tally[v.targetPlayerId] ?? 0) + 1;
  }
  for (const [playerId, count] of Object.entries(tally)) {
    const player = room.players.find((p) => p.id === playerId);
    if (player) player.score += count;
  }
  room.history.push({
    round: room.round,
    acronym: room.currentAcronym!,
    themeId: room.currentThemeId!,
    submissions: room.submissions,
    tally,
  });
  room.phase = "results";
  room.deadline = null;
  return room;
}

/** Auto-advances writing -> voting -> results based on deadlines / completion. */
function applyAutoAdvance(room: Room): Room {
  const now = Date.now();

  if (room.phase === "writing") {
    const everyoneSubmitted =
      room.players.length > 0 && room.submissions.length >= room.players.length;
    if (everyoneSubmitted || (room.deadline !== null && now >= room.deadline)) {
      if (room.submissions.length === 0) {
        // Nobody answered in time; skip straight to an empty results screen.
        room.history.push({
          round: room.round,
          acronym: room.currentAcronym!,
          themeId: room.currentThemeId!,
          submissions: [],
          tally: {},
        });
        room.phase = "results";
        room.deadline = null;
      } else {
        room.phase = "voting";
        room.deadline = now + VOTING_MS;
      }
    }
  }

  if (room.phase === "voting") {
    const eligibleVoters = room.players.length;
    const everyoneVoted = eligibleVoters > 0 && room.votes.length >= eligibleVoters;
    if (everyoneVoted || (room.deadline !== null && now >= room.deadline)) {
      finishVotingIntoResults(room);
    }
  }

  return room;
}

export async function getRoom(code: string): Promise<Room | null> {
  const room = await getKV().get<Room>(key(code));
  if (!room) return null;
  const before = JSON.stringify(room);
  applyAutoAdvance(room);
  if (JSON.stringify(room) !== before) {
    await save(room);
  }
  return room;
}

export async function createRoom(
  hostName: string,
  maxRounds: number
): Promise<{ room: Room; playerId: string }> {
  const playerId = generatePlayerId();
  let code = generateRoomCode();
  // Extremely unlikely collision, but check anyway.
  while (await getKV().get(key(code))) {
    code = generateRoomCode();
  }

  const room: Room = {
    code,
    hostId: playerId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    phase: "lobby",
    round: 0,
    maxRounds: Math.min(10, Math.max(1, maxRounds)),
    players: [{ id: playerId, name: hostName.slice(0, 20), score: 0, joinedAt: Date.now() }],
    currentAcronym: null,
    currentThemeId: null,
    submissions: [],
    votes: [],
    deadline: null,
    history: [],
  };

  await save(room);
  return { room, playerId };
}

export async function joinRoom(
  code: string,
  name: string
): Promise<{ room: Room; playerId: string } | { error: string }> {
  const room = await getRoom(code);
  if (!room) return { error: "Room not found." };
  if (room.phase === "ended") return { error: "This game has already ended." };
  if (room.players.length >= 16) return { error: "Room is full." };

  const playerId = generatePlayerId();
  room.players.push({ id: playerId, name: name.slice(0, 20), score: 0, joinedAt: Date.now() });
  await save(room);
  return { room, playerId };
}

export async function startGame(
  code: string,
  playerId: string
): Promise<{ room: Room } | { error: string }> {
  const room = await getRoom(code);
  if (!room) return { error: "Room not found." };
  if (room.hostId !== playerId) return { error: "Only the host can start the game." };
  if (room.phase !== "lobby") return { error: "Game already started." };
  if (room.players.length < 1) return { error: "Need at least 1 player." };

  startRoundState(room);
  await save(room);
  return { room };
}

export async function nextRound(
  code: string,
  playerId: string
): Promise<{ room: Room } | { error: string }> {
  const room = await getRoom(code);
  if (!room) return { error: "Room not found." };
  if (room.hostId !== playerId) return { error: "Only the host can advance the game." };
  if (room.phase !== "results") return { error: "Not in results phase." };

  if (room.round >= room.maxRounds) {
    room.phase = "ended";
    room.currentAcronym = null;
    room.currentThemeId = null;
    room.deadline = null;
  } else {
    startRoundState(room);
  }
  await save(room);
  return { room };
}

export async function submitAnswer(
  code: string,
  playerId: string,
  text: string
): Promise<{ room: Room } | { error: string }> {
  const room = await getRoom(code);
  if (!room) return { error: "Room not found." };
  if (room.phase !== "writing") return { error: "Not accepting answers right now." };
  if (!room.players.some((p) => p.id === playerId)) return { error: "You are not in this room." };
  if (room.submissions.some((s) => s.playerId === playerId)) {
    return { error: "You already submitted this round." };
  }

  const check = checkInitials(room.currentAcronym!, text);
  if (!check.ok) return { error: check.reason };

  room.submissions.push({
    playerId,
    text: check.words.join(" "),
    submittedAt: Date.now(),
  });
  applyAutoAdvance(room);
  await save(room);
  return { room };
}

export async function castVote(
  code: string,
  voterId: string,
  targetPlayerId: string
): Promise<{ room: Room } | { error: string }> {
  const room = await getRoom(code);
  if (!room) return { error: "Room not found." };
  if (room.phase !== "voting") return { error: "Not voting right now." };
  if (!room.players.some((p) => p.id === voterId)) return { error: "You are not in this room." };
  if (voterId === targetPlayerId) return { error: "You can't vote for yourself." };
  if (!room.submissions.some((s) => s.playerId === targetPlayerId)) {
    return { error: "That player has no submission this round." };
  }

  room.votes = room.votes.filter((v) => v.voterId !== voterId);
  room.votes.push({ voterId, targetPlayerId });
  applyAutoAdvance(room);
  await save(room);
  return { room };
}

export function themeLabel(themeId: string | null): string {
  return getTheme(themeId).label;
}
