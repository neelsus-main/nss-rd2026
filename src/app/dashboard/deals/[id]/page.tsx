import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      account: true,
      owner: true,
      contacts: {
        include: { contact: true },
      },
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

  if (!deal) {
    redirect("/dashboard/deals");
  }

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
          <div className="mb-8">
            <Link
              href="/dashboard/deals"
              className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
            >
              ← Back to Deals
            </Link>
            <h1 className="mt-4 text-3xl font-bold text-black dark:text-white">
              {deal.name}
            </h1>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Deal Details */}
              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="mb-4 text-lg font-semibold text-black dark:text-white">
                  Deal Information
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Amount
                    </p>
                    <p className="mt-1 text-lg font-semibold text-black dark:text-white">
                      ${deal.amount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Stage
                    </p>
                    <p className="mt-1">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          stageColors[deal.stage] || "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                        }`}
                      >
                        {deal.stage}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Probability
                    </p>
                    <p className="mt-1 text-black dark:text-white">
                      {deal.probability}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Expected Close Date
                    </p>
                    <p className="mt-1 text-black dark:text-white">
                      {deal.closeDate
                        ? new Date(deal.closeDate).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                  {deal.hubspotRecordId && (
                    <div>
                      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                        Hubspot Record ID
                      </p>
                      <p className="mt-1 text-black dark:text-white">
                        {deal.hubspotRecordId}
                      </p>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Account
                    </p>
                    <p className="mt-1 text-black dark:text-white">
                      {deal.account ? (
                        <Link
                          href={`/dashboard/accounts/${deal.account.id}`}
                          className="text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {deal.account.name}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contacts */}
              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="mb-4 text-lg font-semibold text-black dark:text-white">
                  Contacts ({deal.contacts.length})
                </h2>
                <div className="space-y-3">
                  {deal.contacts.map((dealContact) => (
                    <Link
                      key={dealContact.contact.id}
                      href={`/dashboard/contacts/${dealContact.contact.id}`}
                      className="block rounded-lg border border-zinc-200 p-3 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                    >
                      <p className="font-medium text-black dark:text-white">
                        {dealContact.contact.firstName} {dealContact.contact.lastName}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {dealContact.contact.email || dealContact.contact.phone || "-"}
                      </p>
                    </Link>
                  ))}
                  {deal.contacts.length === 0 && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      No contacts yet
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
                  {deal.notes.map((note) => (
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
                  {deal.notes.length === 0 && (
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
                      {deal.owner?.name || deal.owner?.email || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Activities */}
              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="mb-4 text-sm font-semibold text-black dark:text-white">
                  Recent Activities
                </h3>
                <div className="space-y-3">
                  {deal.activities.map((activity) => (
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
                  {deal.activities.length === 0 && (
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
