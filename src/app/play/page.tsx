"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { storePlayer } from "./playerStorage";

export default function PlayLobbyPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [maxRounds, setMaxRounds] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function createRoom() {
    if (!name.trim()) return setError("名前を入力してください。");
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, maxRounds }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? "作成に失敗しました。");
      storePlayer(data.room.code, data.playerId, name);
      router.push(`/play/${data.room.code}`);
    });
  }

  function joinRoom() {
    if (!name.trim()) return setError("名前を入力してください。");
    if (!code.trim()) return setError("ルームコードを入力してください。");
    setError(null);
    startTransition(async () => {
      const roomCode = code.trim().toUpperCase();
      const res = await fetch(`/api/room/${roomCode}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? "参加に失敗しました。");
      storePlayer(roomCode, data.playerId, name);
      router.push(`/play/${roomCode}`);
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-zinc-500 transition hover:text-zinc-300">
          ← トップへ
        </Link>
        <h1 className="text-xl font-bold text-amber-300">マルチプレイ</h1>
        <span className="w-16" />
      </div>

      <div className="flex rounded-2xl border border-white/10 bg-white/[0.03] p-1">
        <button
          onClick={() => setMode("create")}
          className={`btn-pill-toggle flex-1 ${
            mode === "create"
              ? "bg-gradient-to-r from-amber-400 to-orange-500 text-zinc-900"
              : "text-zinc-400"
          }`}
        >
          ルームを作る
        </button>
        <button
          onClick={() => setMode("join")}
          className={`btn-pill-toggle flex-1 ${
            mode === "join"
              ? "bg-gradient-to-r from-amber-400 to-orange-500 text-zinc-900"
              : "text-zinc-400"
          }`}
        >
          参加する
        </button>
      </div>

      <div className="card space-y-5 p-7">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">名前</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            placeholder="ニックネーム"
            className="input-field"
          />
        </div>

        {mode === "create" ? (
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">ラウンド数</label>
            <div className="flex gap-2">
              {[3, 5, 7].map((n) => (
                <button
                  key={n}
                  onClick={() => setMaxRounds(n)}
                  className={`h-10 w-10 rounded-xl border font-semibold transition ${
                    maxRounds === n
                      ? "border-amber-400 bg-gradient-to-br from-amber-400 to-orange-500 text-zinc-900"
                      : "border-white/10 bg-white/[0.02] text-zinc-300 hover:bg-white/[0.06]"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              ルームコード
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={4}
              placeholder="ABCD"
              className="input-field font-mono text-lg tracking-widest"
            />
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          onClick={mode === "create" ? createRoom : joinRoom}
          disabled={isPending}
          className="btn-amber w-full"
        >
          {isPending ? "処理中..." : mode === "create" ? "ルームを作成" : "参加する"}
        </button>
      </div>
    </main>
  );
}
