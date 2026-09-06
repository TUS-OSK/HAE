/** A little floor-cushion (座布団) icon used to represent zabuton points. */
export function Cushion({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect
        x="3"
        y="6"
        width="18"
        height="13"
        rx="2.5"
        className="fill-amber-400 stroke-amber-700 dark:fill-amber-500 dark:stroke-amber-800"
        strokeWidth="1"
      />
      <circle cx="5" cy="8" r="1" className="fill-amber-700 dark:fill-amber-900" />
      <circle cx="19" cy="8" r="1" className="fill-amber-700 dark:fill-amber-900" />
      <circle cx="5" cy="17" r="1" className="fill-amber-700 dark:fill-amber-900" />
      <circle cx="19" cy="17" r="1" className="fill-amber-700 dark:fill-amber-900" />
    </svg>
  );
}

export function CushionStack({ count }: { count: number }) {
  const shown = Math.min(count, 6);
  return (
    <span className="inline-flex items-center gap-0.5" title={`${count} zabuton`}>
      {Array.from({ length: shown }, (_, i) => (
        <Cushion key={i} className="h-4 w-4" />
      ))}
      {count > shown && (
        <span className="ml-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
          +{count - shown}
        </span>
      )}
      {count === 0 && <span className="text-xs text-zinc-400">0</span>}
    </span>
  );
}
