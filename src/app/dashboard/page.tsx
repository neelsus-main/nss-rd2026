import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import prisma from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Get CRM stats
  const [accountsCount, contactsCount, dealsCount, leadsCount, totalRevenue] = await Promise.all([
    prisma.account.count(),
    prisma.contact.count(),
    prisma.deal.count({ where: { stage: { not: "Closed Lost" } } }),
    prisma.lead.count({ where: { status: { not: "Converted" } } }),
    prisma.deal.aggregate({
      where: { stage: "Closed Won" },
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
              Welcome back, {session.user.name || session.user.email}!
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Here's what's happening with your CRM today.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Accounts
                  </p>
                  <p className="mt-2 text-3xl font-bold text-black dark:text-white">
                    {accountsCount}
                  </p>
                </div>
                <div className="text-4xl">🏢</div>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Contacts
                  </p>
                  <p className="mt-2 text-3xl font-bold text-black dark:text-white">
                    {contactsCount}
                  </p>
                </div>
                <div className="text-4xl">👤</div>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Active Deals
                  </p>
                  <p className="mt-2 text-3xl font-bold text-black dark:text-white">
                    {dealsCount}
                  </p>
                </div>
                <div className="text-4xl">💰</div>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Total Revenue
                  </p>
                  <p className="mt-2 text-3xl font-bold text-black dark:text-white">
                    ${totalRevenue._sum.amount?.toLocaleString() || "0"}
                  </p>
                </div>
                <div className="text-4xl">📈</div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-lg font-semibold text-black dark:text-white mb-4">
                Recent Deals
              </h2>
              <div className="space-y-4">
                {await prisma.deal.findMany({
                  take: 5,
                  orderBy: { updatedAt: "desc" },
                  include: { account: true, owner: true },
                }).then((deals) =>
                  deals.length > 0 ? (
                    deals.map((deal) => (
                      <div key={deal.id} className="border-b border-zinc-200 pb-3 dark:border-zinc-800">
                        <p className="font-medium text-black dark:text-white">{deal.name}</p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {deal.account?.name} • ${deal.amount.toLocaleString()} • {deal.stage}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-500">No deals yet</p>
                  )
                )}
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-lg font-semibold text-black dark:text-white mb-4">
                Recent Leads
              </h2>
              <div className="space-y-4">
                {await prisma.lead.findMany({
                  take: 5,
                  orderBy: { updatedAt: "desc" },
                  include: { owner: true },
                }).then((leads) =>
                  leads.length > 0 ? (
                    leads.map((lead) => (
                      <div key={lead.id} className="border-b border-zinc-200 pb-3 dark:border-zinc-800">
                        <p className="font-medium text-black dark:text-white">
                          {lead.firstName} {lead.lastName}
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {lead.company} • {lead.status}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-500">No leads yet</p>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
