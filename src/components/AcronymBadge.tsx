export function AcronymBadge({ acronym }: { acronym: string }) {
  return (
    <div className="flex gap-2.5" aria-label={`Acronym: ${acronym}`}>
      {acronym.split("").map((letter, i) => (
        <span
          key={i}
          className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-violet-400/30 bg-white/[0.03] text-3xl font-bold shadow-[0_4px_20px_-6px_rgba(168,85,247,0.5)]"
        >
          <span className="absolute inset-0 bg-gradient-to-br from-violet-500/25 to-fuchsia-500/10" />
          <span className="relative gradient-text">{letter}</span>
        </span>
      ))}
    </div>
  );
}
