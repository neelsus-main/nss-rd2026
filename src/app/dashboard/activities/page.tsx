import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function ActivitiesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const activities = await prisma.activity.findMany({
    include: {
      owner: true,
      account: true,
      contact: true,
      deal: true,
      lead: true,
    },
    orderBy: { dueDate: "asc" },
  });

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-black">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black dark:text-white">
                Activities
              </h1>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Track calls, meetings, tasks, and notes
              </p>
            </div>
            <Link
              href="/dashboard/activities/new"
              className="rounded-lg bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              + New Activity
            </Link>
          </div>

          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {activity.type === "Call" && "📞"}
                        {activity.type === "Email" && "📧"}
                        {activity.type === "Meeting" && "🤝"}
                        {activity.type === "Task" && "✓"}
                        {activity.type === "Note" && "📝"}
                      </span>
                      <div>
                        <h3 className="font-semibold text-black dark:text-white">
                          {activity.subject}
                        </h3>
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                          {activity.account && `Account: ${activity.account.name} • `}
                          {activity.contact &&
                            `Contact: ${activity.contact.firstName} ${activity.contact.lastName} • `}
                          {activity.deal && `Deal: ${activity.deal.name} • `}
                          {activity.lead &&
                            `Lead: ${activity.lead.firstName} ${activity.lead.lastName}`}
                        </p>
                        {activity.description && (
                          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                            {activity.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    {activity.dueDate && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {new Date(activity.dueDate).toLocaleDateString()}
                      </p>
                    )}
                    <span
                      className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        activity.completed
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      }`}
                    >
                      {activity.completed ? "Completed" : "Pending"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-zinc-500 dark:text-zinc-400">
                  No activities yet. Create your first activity to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
