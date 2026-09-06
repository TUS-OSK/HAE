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
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          ← トップへ
        </Link>
        <h1 className="text-xl font-bold">マルチプレイ</h1>
        <span />
      </div>

      <div className="flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900">
        <button
          onClick={() => setMode("create")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${
            mode === "create" ? "bg-white shadow dark:bg-zinc-800" : "text-zinc-500"
          }`}
        >
          ルームを作る
        </button>
        <button
          onClick={() => setMode("join")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${
            mode === "join" ? "bg-white shadow dark:bg-zinc-800" : "text-zinc-500"
          }`}
        >
          参加する
        </button>
      </div>

      <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <label className="mb-1 block text-sm font-medium">名前</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            placeholder="ニックネーム"
            className="w-full rounded-lg border border-zinc-300 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>

        {mode === "create" ? (
          <div>
            <label className="mb-1 block text-sm font-medium">ラウンド数</label>
            <div className="flex gap-2">
              {[3, 5, 7].map((n) => (
                <button
                  key={n}
                  onClick={() => setMaxRounds(n)}
                  className={`h-10 w-10 rounded-lg border font-semibold ${
                    maxRounds === n
                      ? "border-amber-500 bg-amber-500 text-white"
                      : "border-zinc-300 dark:border-zinc-700"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-sm font-medium">ルームコード</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={4}
              placeholder="ABCD"
              className="w-full rounded-lg border border-zinc-300 bg-white p-2 font-mono text-lg tracking-widest dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={mode === "create" ? createRoom : joinRoom}
          disabled={isPending}
          className="w-full rounded-xl bg-amber-500 py-3 font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
        >
          {isPending ? "処理中..." : mode === "create" ? "ルームを作成" : "参加する"}
        </button>
      </div>
    </main>
  );
}
