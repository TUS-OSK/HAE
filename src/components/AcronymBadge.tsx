export function AcronymBadge({ acronym }: { acronym: string }) {
  return (
    <div className="flex gap-2" aria-label={`Acronym: ${acronym}`}>
      {acronym.split("").map((letter, i) => (
        <span
          key={i}
          className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-indigo-400 bg-indigo-50 text-3xl font-bold text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950 dark:text-indigo-300"
        >
          {letter}
        </span>
      ))}
    </div>
  );
}
