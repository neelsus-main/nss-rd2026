import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      account: true,
      owner: true,
      deals: {
        include: { deal: true },
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

  if (!contact) {
    redirect("/dashboard/contacts");
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-black">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link
              href="/dashboard/contacts"
              className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
            >
              ← Back to Contacts
            </Link>
            <h1 className="mt-4 text-3xl font-bold text-black dark:text-white">
              {contact.firstName} {contact.lastName}
            </h1>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Details */}
              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="mb-4 text-lg font-semibold text-black dark:text-white">
                  Contact Information
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Email
                    </p>
                    <p className="mt-1 text-black dark:text-white">
                      {contact.email || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Phone
                    </p>
                    <p className="mt-1 text-black dark:text-white">
                      {contact.phone || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Mobile
                    </p>
                    <p className="mt-1 text-black dark:text-white">
                      {contact.mobile || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Title
                    </p>
                    <p className="mt-1 text-black dark:text-white">
                      {contact.title || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Department
                    </p>
                    <p className="mt-1 text-black dark:text-white">
                      {contact.department || "-"}
                    </p>
                  </div>
                  {contact.hubspotRecordId && (
                    <div>
                      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                        Hubspot Record ID
                      </p>
                      <p className="mt-1 text-black dark:text-white">
                        {contact.hubspotRecordId}
                      </p>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Account
                    </p>
                    <p className="mt-1 text-black dark:text-white">
                      {contact.account ? (
                        <Link
                          href={`/dashboard/accounts/${contact.account.id}`}
                          className="text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {contact.account.name}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Deals */}
              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="mb-4 text-lg font-semibold text-black dark:text-white">
                  Deals ({contact.deals.length})
                </h2>
                <div className="space-y-3">
                  {contact.deals.map((dealContact) => (
                    <Link
                      key={dealContact.deal.id}
                      href={`/dashboard/deals/${dealContact.deal.id}`}
                      className="block rounded-lg border border-zinc-200 p-3 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                    >
                      <p className="font-medium text-black dark:text-white">
                        {dealContact.deal.name}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {dealContact.deal.stage} • ${dealContact.deal.amount.toLocaleString()}
                      </p>
                    </Link>
                  ))}
                  {contact.deals.length === 0 && (
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
                  {contact.notes.map((note) => (
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
                  {contact.notes.length === 0 && (
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
                      {contact.owner?.name || contact.owner?.email || "-"}
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
                  {contact.activities.map((activity) => (
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
                  {contact.activities.length === 0 && (
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
