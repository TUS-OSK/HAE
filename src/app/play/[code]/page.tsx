"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Room } from "@/lib/room";
import { THEMES } from "@/lib/acronym";
import { AcronymBadge } from "@/components/AcronymBadge";
import { CushionStack } from "@/components/Cushion";
import { loadPlayer, storePlayer, type StoredPlayer } from "../playerStorage";

function themeLabelFor(id: string | null) {
  if (!id) return null;
  return THEMES.find((t) => t.id === id)?.label ?? null;
}

function useCountdown(deadline: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [deadline]);
  if (!deadline) return null;
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

export default function RoomPage() {
  const params = useParams<{ code: string }>();
  const code = (params.code as string)?.toUpperCase();

  const [player, setPlayer] = useState<StoredPlayer | null>(() =>
    code ? loadPlayer(code) : null
  );
  const [joinName, setJoinName] = useState("");
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    async function poll() {
      const res = await fetch(`/api/room/${code}`, { cache: "no-store" });
      if (cancelled) return;
      if (res.ok) {
        const data = await res.json();
        setRoom(data.room);
      }
    }
    poll();
    const id = setInterval(poll, 1500);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [code]);

  const me = useMemo(
    () => room?.players.find((p) => p.id === player?.playerId) ?? null,
    [room, player]
  );
  const isHost = room?.hostId === player?.playerId;
  const countdown = useCountdown(room?.deadline ?? null);
  const mySubmission = room?.submissions.find((s) => s.playerId === player?.playerId);
  const myVote = room?.votes.find((v) => v.voterId === player?.playerId);

  async function joinExisting() {
    if (!joinName.trim() || !code) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/room/${code}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: joinName }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "参加に失敗しました。");
    storePlayer(code, data.playerId, joinName);
    setPlayer({ playerId: data.playerId, name: joinName });
    setRoom(data.room);
  }

  async function callAction(path: string, body: Record<string, unknown>) {
    if (!code) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/room/${code}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "エラーが発生しました。");
    setRoom(data.room);
  }

  if (!code) return null;

  if (!room) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-10">
        <p className="text-zinc-500">ルームを読み込み中...</p>
      </main>
    );
  }

  if (!player) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-6 py-10">
        <h1 className="text-xl font-bold">ルーム {code} に参加</h1>
        <input
          value={joinName}
          onChange={(e) => setJoinName(e.target.value)}
          maxLength={20}
          placeholder="ニックネーム"
          className="w-full rounded-lg border border-zinc-300 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-800"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          onClick={joinExisting}
          disabled={busy}
          className="w-full rounded-xl bg-amber-500 py-3 font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
        >
          参加する
        </button>
      </main>
    );
  }

  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
  const lastRound = room.history[room.history.length - 1];

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          ← トップへ
        </Link>
        <h1 className="font-mono text-2xl font-bold tracking-widest">{code}</h1>
        <span className="text-sm text-zinc-500">
          Round {room.round}/{room.maxRounds}
        </span>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {room.phase === "lobby" && (
        <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">
            このコードを友達に共有: <span className="font-mono font-bold">{code}</span>
          </p>
          <ul className="space-y-1">
            {room.players.map((p) => (
              <li key={p.id} className="flex items-center gap-2">
                <span>{p.name}</span>
                {p.id === room.hostId && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    ホスト
                  </span>
                )}
              </li>
            ))}
          </ul>
          {isHost ? (
            <button
              onClick={() => callAction("start", { playerId: player.playerId })}
              disabled={busy}
              className="w-full rounded-xl bg-amber-500 py-3 font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
            >
              ゲームを開始
            </button>
          ) : (
            <p className="text-center text-sm text-zinc-500">ホストの開始を待っています...</p>
          )}
        </div>
      )}

      {room.phase === "writing" && (
        <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <AcronymBadge acronym={room.currentAcronym!} />
            <span className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
              {countdown}s
            </span>
          </div>
          {themeLabelFor(room.currentThemeId) && room.currentThemeId !== "none" && (
            <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {themeLabelFor(room.currentThemeId)}
            </span>
          )}

          {!mySubmission ? (
            <>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={2}
                placeholder={`${room.currentAcronym!.length}語のフレーズを入力`}
                className="w-full resize-none rounded-lg border border-zinc-300 bg-white p-3 text-lg dark:border-zinc-700 dark:bg-zinc-800"
              />
              <button
                onClick={() =>
                  callAction("submit", { playerId: player.playerId, text: answer }).then(() =>
                    setAnswer("")
                  )
                }
                disabled={busy || !answer.trim()}
                className="w-full rounded-xl bg-amber-500 py-3 font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
              >
                送信
              </button>
            </>
          ) : (
            <p className="rounded-lg bg-zinc-100 p-3 text-center text-sm dark:bg-zinc-800">
              送信済み: 「{mySubmission.text}」— 他のプレイヤーを待っています (
              {room.submissions.length}/{room.players.length})
            </p>
          )}
        </div>
      )}

      {room.phase === "voting" && (
        <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">投票タイム 座布団を贈ろう</h2>
            <span className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
              {countdown}s
            </span>
          </div>
          <ul className="space-y-2">
            {room.submissions.map((s) => {
              const isMine = s.playerId === player.playerId;
              const isVoted = myVote?.targetPlayerId === s.playerId;
              return (
                <li
                  key={s.playerId}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    isVoted
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-950"
                      : "border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  <span>{s.text}</span>
                  {isMine ? (
                    <span className="text-xs text-zinc-400">あなたの回答</span>
                  ) : (
                    <button
                      onClick={() =>
                        callAction("vote", {
                          playerId: player.playerId,
                          targetPlayerId: s.playerId,
                        })
                      }
                      disabled={busy}
                      className={`rounded-lg px-3 py-1 text-sm font-medium ${
                        isVoted
                          ? "bg-amber-500 text-white"
                          : "border border-zinc-300 dark:border-zinc-700"
                      }`}
                    >
                      {isVoted ? "投票済み" : "座布団1枚"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {room.phase === "results" && lastRound && (
        <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold">
            ラウンド {lastRound.round} の結果 — {lastRound.acronym}
          </h2>
          {lastRound.submissions.length === 0 ? (
            <p className="text-sm text-zinc-500">誰も回答しませんでした。</p>
          ) : (
            <ul className="space-y-2">
              {[...lastRound.submissions]
                .sort((a, b) => (lastRound.tally[b.playerId] ?? 0) - (lastRound.tally[a.playerId] ?? 0))
                .map((s) => {
                  const author = room.players.find((p) => p.id === s.playerId);
                  return (
                    <li
                      key={s.playerId}
                      className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800"
                    >
                      <span>
                        <span className="font-medium">{author?.name ?? "?"}</span>: {s.text}
                      </span>
                      <CushionStack count={lastRound.tally[s.playerId] ?? 0} />
                    </li>
                  );
                })}
            </ul>
          )}

          <h3 className="pt-2 text-sm font-semibold text-zinc-500">総合順位</h3>
          <ol className="space-y-1">
            {sortedPlayers.map((p, i) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <span>
                  {i + 1}. {p.name}
                </span>
                <CushionStack count={p.score} />
              </li>
            ))}
          </ol>

          {isHost ? (
            <button
              onClick={() => callAction("next", { playerId: player.playerId })}
              disabled={busy}
              className="w-full rounded-xl bg-amber-500 py-3 font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {room.round >= room.maxRounds ? "最終結果を見る" : "次のラウンドへ"}
            </button>
          ) : (
            <p className="text-center text-sm text-zinc-500">ホストの操作を待っています...</p>
          )}
        </div>
      )}

      {room.phase === "ended" && (
        <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-xl font-bold">ゲーム終了！</h2>
          <ol className="space-y-2">
            {sortedPlayers.map((p, i) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800"
              >
                <span className="font-medium">
                  {i === 0 ? "🏆 " : `${i + 1}. `}
                  {p.name}
                  {p.id === me?.id ? " (あなた)" : ""}
                </span>
                <CushionStack count={p.score} />
              </li>
            ))}
          </ol>
          <Link
            href="/play"
            className="block w-full rounded-xl bg-amber-500 py-3 text-center font-semibold text-white hover:bg-amber-600"
          >
            もう一度遊ぶ
          </Link>
        </div>
      )}
    </main>
  );
}
