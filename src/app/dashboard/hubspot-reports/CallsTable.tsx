"use client";

import { useState } from "react";

interface CallRow {
  id: string;
  date: string;
  title: string;
  user: string;
  direction: string;
  status: string;
  duration: string;
  body: string;
  contactName: string | null;
  hubspotUrl: string | null;
}

const PAGE_SIZES = [25, 50, 100];

const BADGE_COLORS = [
  "bg-orange-500",
  "bg-blue-500",
  "bg-green-600",
  "bg-purple-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-red-500",
  "bg-amber-500",
];

function Initials({ name }: { name: string }) {
  const chars = name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const color = BADGE_COLORS[name.charCodeAt(0) % BADGE_COLORS.length];
  return (
    <span
      className={`inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white ${color}`}
    >
      {chars || "?"}
    </span>
  );
}

type SortKey = "date" | "title" | "user" | "status" | "duration" | "contactName";

const COLUMNS: { key: SortKey | null; label: string; cls?: string }[] = [
  { key: "title",       label: "Call Title",    cls: "min-w-[160px]" },
  { key: "date",        label: "Activity Date", cls: "min-w-[170px]" },
  { key: "user",        label: "Assigned To",   cls: "min-w-[140px]" },
  { key: "status",      label: "Call Outcome",  cls: "min-w-[120px]" },
  { key: null,          label: "Notes",         cls: "min-w-[180px]" },
  { key: "duration",    label: "Duration",      cls: "min-w-[90px]" },
  { key: "contactName", label: "Contact",       cls: "min-w-[140px]" },
];

export default function CallsTable({ rows }: { rows: CallRow[] }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "date",
    dir: "desc",
  });

  function toggleSort(key: SortKey | null) {
    if (!key) return;
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
    setPage(1);
  }

  const sorted = [...rows].sort((a, b) => {
    const av = String(a[sort.key] ?? "");
    const bv = String(b[sort.key] ?? "");
    const cmp = av.localeCompare(bv);
    return sort.dir === "asc" ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const visible = sorted.slice(start, start + pageSize);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/60">
              {COLUMNS.map((col) => (
                <th
                  key={col.label}
                  onClick={() => toggleSort(col.key)}
                  className={`px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 ${col.cls ?? ""} ${col.key ? "cursor-pointer select-none hover:text-zinc-800 dark:hover:text-zinc-200" : ""}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.key && (
                      <span className="text-zinc-300 dark:text-zinc-600">
                        {sort.key === col.key
                          ? sort.dir === "asc"
                            ? "↑"
                            : "↓"
                          : "↕"}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {visible.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-blue-50/40 dark:hover:bg-blue-900/10"
              >
                {/* Call Title */}
                <td className="px-3 py-2">
                  {row.hubspotUrl ? (
                    <a
                      href={row.hubspotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block max-w-[200px] truncate font-medium text-blue-600 hover:underline dark:text-blue-400"
                      title={row.title}
                    >
                      {row.title}
                    </a>
                  ) : (
                    <span
                      className="block max-w-[200px] truncate font-medium text-zinc-800 dark:text-zinc-200"
                      title={row.title}
                    >
                      {row.title}
                    </span>
                  )}
                </td>

                {/* Activity Date */}
                <td className="whitespace-nowrap px-3 py-2 text-zinc-600 dark:text-zinc-400">
                  {row.date}
                </td>

                {/* Assigned To */}
                <td className="whitespace-nowrap px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    {row.user !== "—" && <Initials name={row.user} />}
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {row.user}
                    </span>
                  </div>
                </td>

                {/* Call Outcome */}
                <td className="whitespace-nowrap px-3 py-2 capitalize text-zinc-600 dark:text-zinc-400">
                  {row.status.toLowerCase()}
                </td>

                {/* Notes */}
                <td className="px-3 py-2">
                  <span
                    className="block max-w-[220px] truncate text-zinc-500 dark:text-zinc-400"
                    title={row.body || undefined}
                  >
                    {row.body || "—"}
                  </span>
                </td>

                {/* Duration */}
                <td className="whitespace-nowrap px-3 py-2 text-zinc-600 dark:text-zinc-400">
                  {row.duration}
                </td>

                {/* Contact */}
                <td className="whitespace-nowrap px-3 py-2">
                  {row.contactName && row.hubspotUrl ? (
                    <a
                      href={row.hubspotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-blue-600 hover:underline dark:text-blue-400"
                    >
                      <Initials name={row.contactName} />
                      <span>{row.contactName}</span>
                    </a>
                  ) : row.contactName ? (
                    <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                      <Initials name={row.contactName} />
                      <span>{row.contactName}</span>
                    </div>
                  ) : (
                    <span className="text-zinc-400 dark:text-zinc-600">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-2.5 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        <div className="flex items-center gap-1.5">
          <span>Rows:</span>
          {PAGE_SIZES.map((n) => (
            <button
              key={n}
              onClick={() => {
                setPageSize(n);
                setPage(1);
              }}
              className={`rounded px-1.5 py-0.5 font-medium transition-colors ${
                pageSize === n
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span>
            {start + 1}–{Math.min(start + pageSize, rows.length)} of{" "}
            {rows.length}
          </span>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="rounded px-1.5 py-0.5 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
            aria-label="Previous"
          >
            ‹
          </button>
          <span>
            {safePage}/{totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="rounded px-1.5 py-0.5 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
            aria-label="Next"
          >
            ›
          </button>
        </div>
      </div>
    </>
  );
}
