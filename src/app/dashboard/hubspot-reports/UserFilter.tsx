"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface UserFilterProps {
  owners: { id: string; name: string }[];
  selectedUserId: string;
}

export default function UserFilter({ owners, selectedUserId }: UserFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(userId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (userId) {
      params.set("user", userId);
    } else {
      params.delete("user");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-zinc-500 dark:text-zinc-400">
        Salesperson
      </label>
      <select
        value={selectedUserId}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      >
        <option value="">All Salespersons</option>
        {owners.map((owner) => (
          <option key={owner.id} value={owner.id}>
            {owner.name}
          </option>
        ))}
      </select>
    </div>
  );
}
