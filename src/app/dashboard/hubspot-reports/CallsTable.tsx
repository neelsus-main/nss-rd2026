"use client";

import { useState } from "react";

interface CallRow {
  id: string;
  date: string;
  title: string;
  user: string;
  direction: string;
  status: string;
  statusCls: string;
  duration: string;
  from: string;
  to: string;
  hubspotUrl: string | null;
}

const PAGE_SIZES = [25, 50, 100];

export default function CallsTable({ rows }: { rows: CallRow[] }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const visible = rows.slice(start, start + pageSize);

  function handlePageSize(n: number) {
    setPageSize(n);
    setPage(1);
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-6 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Record ID</th>
              <th className="px-6 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Date</th>
              <th className="px-6 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Title</th>
              <th className="px-6 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">User</th>
              <th className="px-6 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Direction</th>
              <th className="px-6 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Status</th>
              <th className="px-6 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Duration</th>
              <th className="px-6 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">From</th>
              <th className="px-6 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">To</th>
              <th className="px-6 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {visible.map((row) => (
              <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                  {row.id}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-zinc-700 dark:text-zinc-300">
                  {row.date}
                </td>
                <td className="max-w-[200px] truncate px-6 py-4 font-medium text-black dark:text-white">
                  {row.title}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-zinc-700 dark:text-zinc-300">
                  {row.user}
                </td>
                <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">{row.direction}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${row.statusCls}`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">{row.duration}</td>
                <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">{row.from}</td>
                <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">{row.to}</td>
                <td className="whitespace-nowrap px-6 py-4">
                  {row.hubspotUrl ? (
                    <a
                      href={row.hubspotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    >
                      View in HubSpot ↗
                    </a>
                  ) : (
                    <span className="text-zinc-400 dark:text-zinc-600">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <span>Rows per page:</span>
          {PAGE_SIZES.map((n) => (
            <button
              key={n}
              onClick={() => handlePageSize(n)}
              className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                pageSize === n
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
          <span>
            {start + 1}–{Math.min(start + pageSize, rows.length)} of {rows.length}
          </span>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="rounded p-1 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
            aria-label="Previous page"
          >
            ‹
          </button>
          <span>
            {safePage} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="rounded p-1 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
            aria-label="Next page"
          >
            ›
          </button>
        </div>
      </div>
    </>
  );
}
