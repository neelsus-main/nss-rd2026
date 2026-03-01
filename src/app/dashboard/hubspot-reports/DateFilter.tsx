"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface DateFilterProps {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getPresets() {
  const today = new Date();
  const todayStr = toDateString(today);

  const past7 = new Date(today);
  past7.setDate(past7.getDate() - 7);

  const past30 = new Date(today);
  past30.setDate(past30.getDate() - 30);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

  return [
    { label: "Past 7 days", from: toDateString(past7), to: todayStr },
    { label: "Past 30 days", from: toDateString(past30), to: todayStr },
    { label: "This month", from: toDateString(startOfMonth), to: todayStr },
    { label: "Last month", from: toDateString(startOfLastMonth), to: toDateString(endOfLastMonth) },
  ];
}

export default function DateFilter({ from, to }: DateFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const presets = getPresets();

  function navigate(newFrom: string, newTo: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", newFrom);
    params.set("to", newTo);
    router.push(`${pathname}?${params.toString()}`);
  }

  const activePreset = presets.find((p) => p.from === from && p.to === to);

  return (
    <div className="flex flex-wrap items-end gap-4">
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => {
          const isActive = p.from === from && p.to === to;
          return (
            <button
              key={p.label}
              onClick={() => navigate(p.from, p.to)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Date inputs */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-zinc-500 dark:text-zinc-400">From</label>
        <input
          type="date"
          value={from}
          onChange={(e) => e.target.value && navigate(e.target.value, to)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <label className="text-sm text-zinc-500 dark:text-zinc-400">To</label>
        <input
          type="date"
          value={to}
          onChange={(e) => e.target.value && navigate(from, e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
    </div>
  );
}
