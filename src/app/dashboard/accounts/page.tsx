import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AccountFilter from "@/components/AccountFilter";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Suspense } from "react";

type SortField = "name" | "industry" | "contacts" | "deals" | "owner" | "updatedAt";
type SortOrder = "asc" | "desc";

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ sortBy?: string; sortOrder?: string; filter?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const sortBy = (params.sortBy as SortField) || "updatedAt";
  const sortOrder = (params.sortOrder as SortOrder) || "desc";
  const filter = params.filter || "";

  // Build where clause for filtering
  const where = filter
    ? {
        OR: [
          { name: { contains: filter, mode: "insensitive" as const } },
          { industry: { contains: filter, mode: "insensitive" as const } },
          {
            owner: {
              OR: [
                { name: { contains: filter, mode: "insensitive" as const } },
                { email: { contains: filter, mode: "insensitive" as const } },
              ],
            },
          },
        ],
      }
    : {};

  // Build orderBy clause
  let orderBy: any;
  if (sortBy === "contacts" || sortBy === "deals") {
    // For count fields, we need to sort by the relation count
    // This requires a more complex query, so we'll sort in memory for now
    orderBy = { updatedAt: "desc" };
  } else if (sortBy === "owner") {
    orderBy = { owner: { name: sortOrder } };
  } else {
    orderBy = { [sortBy]: sortOrder };
  }

  const accounts = await prisma.account.findMany({
    where,
    include: {
      owner: true,
      _count: {
        select: { contacts: true, deals: true },
      },
    },
    orderBy,
  });

  // Sort by count fields in memory if needed
  let sortedAccounts = accounts;
  if (sortBy === "contacts") {
    sortedAccounts = [...accounts].sort((a, b) => {
      const diff = a._count.contacts - b._count.contacts;
      return sortOrder === "asc" ? diff : -diff;
    });
  } else if (sortBy === "deals") {
    sortedAccounts = [...accounts].sort((a, b) => {
      const diff = a._count.deals - b._count.deals;
      return sortOrder === "asc" ? diff : -diff;
    });
  }

  // Helper function to create sort URL
  const createSortUrl = (field: SortField) => {
    const params = new URLSearchParams();
    if (filter) params.set("filter", filter);
    params.set("sortBy", field);
    params.set("sortOrder", sortBy === field && sortOrder === "asc" ? "desc" : "asc");
    return `/dashboard/accounts?${params.toString()}`;
  };

  // Helper function to get sort indicator
  const getSortIndicator = (field: SortField) => {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? " ↑" : " ↓";
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-black">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black dark:text-white">
                Accounts
              </h1>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Manage your company accounts
              </p>
            </div>
            <Link
              href="/dashboard/accounts/new"
              className="rounded-lg bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              + New Account
            </Link>
          </div>

          <Suspense fallback={<div className="mb-4 h-10 w-full rounded-lg border border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800" />}>
            <AccountFilter />
          </Suspense>

          <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead className="border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="w-[30%] px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      <Link
                        href={createSortUrl("name")}
                        className="flex items-center gap-1 hover:text-black dark:hover:text-white"
                      >
                        Account Name{getSortIndicator("name")}
                      </Link>
                    </th>
                    <th className="w-[18%] px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      <Link
                        href={createSortUrl("industry")}
                        className="flex items-center gap-1 hover:text-black dark:hover:text-white"
                      >
                        Industry{getSortIndicator("industry")}
                      </Link>
                    </th>
                    <th className="w-[10%] px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      <Link
                        href={createSortUrl("contacts")}
                        className="flex items-center gap-1 hover:text-black dark:hover:text-white"
                      >
                        Contacts{getSortIndicator("contacts")}
                      </Link>
                    </th>
                    <th className="w-[12%] px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      <Link
                        href={createSortUrl("deals")}
                        className="flex items-center gap-1 hover:text-black dark:hover:text-white"
                      >
                        Deals{getSortIndicator("deals")}
                      </Link>
                    </th>
                    <th className="w-[20%] px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      <Link
                        href={createSortUrl("owner")}
                        className="flex items-center gap-1 hover:text-black dark:hover:text-white"
                      >
                        Owner{getSortIndicator("owner")}
                      </Link>
                    </th>
                    <th className="w-[10%] px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {sortedAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
                      <td className="px-3 py-4">
                        <Link
                          href={`/dashboard/accounts/${account.id}`}
                          className="font-medium text-black hover:underline dark:text-white truncate block"
                          title={account.name}
                        >
                          {account.name}
                        </Link>
                      </td>
                      <td className="px-3 py-4 text-sm text-zinc-600 dark:text-zinc-400 truncate" title={account.industry || undefined}>
                        {account.industry || "-"}
                      </td>
                      <td className="px-3 py-4 text-sm text-zinc-600 dark:text-zinc-400 text-center">
                        {account._count.contacts}
                      </td>
                      <td className="px-3 py-4 text-sm text-zinc-600 dark:text-zinc-400 text-center">
                        {account._count.deals}
                      </td>
                      <td className="px-3 py-4 text-sm text-zinc-600 dark:text-zinc-400 truncate" title={account.owner?.name || account.owner?.email || undefined}>
                        {account.owner?.name || account.owner?.email || "-"}
                      </td>
                      <td className="px-3 py-4 text-sm">
                        <Link
                          href={`/dashboard/accounts/${account.id}`}
                          className="text-black hover:underline dark:text-white"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sortedAccounts.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <p className="text-zinc-500 dark:text-zinc-400">
                    {filter
                      ? "No accounts found matching your filter."
                      : "No accounts yet. Create your first account to get started."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
