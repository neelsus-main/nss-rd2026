"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export default function AccountFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("filter", value);
    } else {
      params.delete("filter");
    }
    // Reset to first page when filtering
    params.delete("page");
    
    startTransition(() => {
      router.push(`/dashboard/accounts?${params.toString()}`);
    });
  };

  return (
    <div className="mb-4">
      <input
        type="text"
        placeholder="Filter accounts by name, industry, or owner..."
        defaultValue={searchParams.get("filter") || ""}
        onChange={(e) => handleFilterChange(e.target.value)}
        className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-black placeholder-zinc-500 focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-400 dark:focus:border-white dark:focus:ring-white"
      />
    </div>
  );
}
