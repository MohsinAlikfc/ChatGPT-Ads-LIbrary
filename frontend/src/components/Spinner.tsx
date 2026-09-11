export default function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-400">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-brand-500 dark:border-zinc-700 dark:border-t-brand-500" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
