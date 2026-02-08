import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function AccountDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const account = await prisma.account.findUnique({
    where: { id: params.id },
    include: {
      owner: true,
      contacts: true,
      deals: true,
      activities: {
        include: { owner: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      notes: {
        include: { owner: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!account) {
    redirect("/dashboard/accounts");
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-black">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link
              href="/dashboard/accounts"
              className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
            >
              ← Back to Accounts
            </Link>
            <h1 className="mt-4 text-3xl font-bold text-black dark:text-white">
              {account.name}
            </h1>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Account Details */}
              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="mb-4 text-lg font-semibold text-black dark:text-white">
                  Account Information
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Industry
                    </p>
                    <p className="mt-1 text-black dark:text-white">
                      {account.industry || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Website
                    </p>
                    <p className="mt-1 text-black dark:text-white">
                      {account.website ? (
                        <a
                          href={account.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {account.website}
                        </a>
                      ) : (
                        "-"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Phone
                    </p>
                    <p className="mt-1 text-black dark:text-white">
                      {account.phone || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Email
                    </p>
                    <p className="mt-1 text-black dark:text-white">
                      {account.email || "-"}
                    </p>
                  </div>
                  {account.description && (
                    <div className="sm:col-span-2">
                      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                        Description
                      </p>
                      <p className="mt-1 text-black dark:text-white">
                        {account.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contacts */}
              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-black dark:text-white">
                    Contacts ({account.contacts.length})
                  </h2>
                  <Link
                    href={`/dashboard/contacts/new?accountId=${account.id}`}
                    className="text-sm text-black hover:underline dark:text-white"
                  >
                    + Add Contact
                  </Link>
                </div>
                <div className="space-y-3">
                  {account.contacts.map((contact) => (
                    <Link
                      key={contact.id}
                      href={`/dashboard/contacts/${contact.id}`}
                      className="block rounded-lg border border-zinc-200 p-3 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                    >
                      <p className="font-medium text-black dark:text-white">
                        {contact.firstName} {contact.lastName}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {contact.email || contact.phone || "-"}
                      </p>
                    </Link>
                  ))}
                  {account.contacts.length === 0 && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      No contacts yet
                    </p>
                  )}
                </div>
              </div>

              {/* Deals */}
              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-black dark:text-white">
                    Deals ({account.deals.length})
                  </h2>
                  <Link
                    href={`/dashboard/deals/new?accountId=${account.id}`}
                    className="text-sm text-black hover:underline dark:text-white"
                  >
                    + Add Deal
                  </Link>
                </div>
                <div className="space-y-3">
                  {account.deals.map((deal) => (
                    <Link
                      key={deal.id}
                      href={`/dashboard/deals/${deal.id}`}
                      className="block rounded-lg border border-zinc-200 p-3 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-black dark:text-white">
                            {deal.name}
                          </p>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            {deal.stage} • ${deal.amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {account.deals.length === 0 && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      No deals yet
                    </p>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="mb-4 text-lg font-semibold text-black dark:text-white">
                  Notes
                </h2>
                <div className="space-y-4">
                  {account.notes.map((note) => (
                    <div
                      key={note.id}
                      className="border-b border-zinc-200 pb-4 dark:border-zinc-800"
                    >
                      {note.title && (
                        <p className="font-medium text-black dark:text-white">
                          {note.title}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {note.content}
                      </p>
                      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                        {note.owner.name || note.owner.email} •{" "}
                        {new Date(note.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                  {account.notes.length === 0 && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      No notes yet
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="mb-4 text-sm font-semibold text-black dark:text-white">
                  Quick Info
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-zinc-600 dark:text-zinc-400">Owner</p>
                    <p className="mt-1 text-black dark:text-white">
                      {account.owner?.name || account.owner?.email || "-"}
                    </p>
                  </div>
                  {account.annualRevenue && (
                    <div>
                      <p className="text-zinc-600 dark:text-zinc-400">
                        Annual Revenue
                      </p>
                      <p className="mt-1 text-black dark:text-white">
                        ${account.annualRevenue.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {account.employeeCount && (
                    <div>
                      <p className="text-zinc-600 dark:text-zinc-400">
                        Employees
                      </p>
                      <p className="mt-1 text-black dark:text-white">
                        {account.employeeCount}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Activities */}
              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="mb-4 text-sm font-semibold text-black dark:text-white">
                  Recent Activities
                </h3>
                <div className="space-y-3">
                  {account.activities.map((activity) => (
                    <div key={activity.id} className="text-sm">
                      <p className="font-medium text-black dark:text-white">
                        {activity.subject}
                      </p>
                      <p className="text-zinc-600 dark:text-zinc-400">
                        {activity.type} •{" "}
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                  {account.activities.length === 0 && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      No activities yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
