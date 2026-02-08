import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function DealsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const deals = await prisma.deal.findMany({
    include: {
      account: true,
      owner: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const stageColors: Record<string, string> = {
    "Prospecting": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    "Qualification": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    "Proposal": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    "Negotiation": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    "Closed Won": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    "Closed Lost": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-black">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black dark:text-white">
                Deals
              </h1>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Track your sales pipeline
              </p>
            </div>
            <Link
              href="/dashboard/deals/new"
              className="rounded-lg bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              + New Deal
            </Link>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Deal Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Account
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Probability
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Close Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {deals.map((deal) => (
                    <tr key={deal.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
                      <td className="whitespace-nowrap px-6 py-4">
                        <Link
                          href={`/dashboard/deals/${deal.id}`}
                          className="font-medium text-black hover:underline dark:text-white"
                        >
                          {deal.name}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                        {deal.account?.name || "-"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-black dark:text-white">
                        ${deal.amount.toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            stageColors[deal.stage] || "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                          }`}
                        >
                          {deal.stage}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                        {deal.probability}%
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                        {deal.closeDate
                          ? new Date(deal.closeDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <Link
                          href={`/dashboard/deals/${deal.id}`}
                          className="text-black hover:underline dark:text-white"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {deals.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <p className="text-zinc-500 dark:text-zinc-400">
                    No deals yet. Create your first deal to get started.
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
