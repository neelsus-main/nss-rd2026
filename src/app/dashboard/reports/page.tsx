import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import prisma from "@/lib/prisma";

export default async function ReportsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const [
    totalAccounts,
    totalContacts,
    totalDeals,
    totalLeads,
    wonDeals,
    lostDeals,
    totalRevenue,
    pipelineValue,
    dealsByStage,
  ] = await Promise.all([
    prisma.account.count(),
    prisma.contact.count(),
    prisma.deal.count(),
    prisma.lead.count(),
    prisma.deal.count({ where: { stage: "Closed Won" } }),
    prisma.deal.count({ where: { stage: "Closed Lost" } }),
    prisma.deal.aggregate({
      where: { stage: "Closed Won" },
      _sum: { amount: true },
    }),
    prisma.deal.aggregate({
      where: { stage: { notIn: ["Closed Won", "Closed Lost"] } },
      _sum: { amount: true },
    }),
    prisma.deal.groupBy({
      by: ["stage"],
      _count: { id: true },
      _sum: { amount: true },
    }),
  ]);

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-black">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-black dark:text-white">
              Reports & Analytics
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              View your CRM performance metrics
            </p>
          </div>

          {/* Key Metrics */}
          <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Total Revenue
              </p>
              <p className="mt-2 text-3xl font-bold text-black dark:text-white">
                ${totalRevenue._sum.amount?.toLocaleString() || "0"}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Pipeline Value
              </p>
              <p className="mt-2 text-3xl font-bold text-black dark:text-white">
                ${pipelineValue._sum.amount?.toLocaleString() || "0"}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Win Rate
              </p>
              <p className="mt-2 text-3xl font-bold text-black dark:text-white">
                {totalDeals > 0
                  ? Math.round((wonDeals / totalDeals) * 100)
                  : 0}
                %
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Active Deals
              </p>
              <p className="mt-2 text-3xl font-bold text-black dark:text-white">
                {totalDeals - wonDeals - lostDeals}
              </p>
            </div>
          </div>

          {/* Pipeline by Stage */}
          <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-lg font-semibold text-black dark:text-white">
              Pipeline by Stage
            </h2>
            <div className="space-y-4">
              {dealsByStage.map((stage) => (
                <div key={stage.stage}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-black dark:text-white">
                      {stage.stage}
                    </span>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {stage._count.id} deals • $
                      {stage._sum.amount?.toLocaleString() || "0"}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div
                      className="h-full bg-black dark:bg-white"
                      style={{
                        width: `${
                          totalDeals > 0
                            ? (stage._count.id / totalDeals) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Accounts
              </p>
              <p className="mt-2 text-2xl font-bold text-black dark:text-white">
                {totalAccounts}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Contacts
              </p>
              <p className="mt-2 text-2xl font-bold text-black dark:text-white">
                {totalContacts}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Total Deals
              </p>
              <p className="mt-2 text-2xl font-bold text-black dark:text-white">
                {totalDeals}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Leads
              </p>
              <p className="mt-2 text-2xl font-bold text-black dark:text-white">
                {totalLeads}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
