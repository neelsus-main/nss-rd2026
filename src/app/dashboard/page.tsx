import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-black dark:text-white">
                Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {session.user.email}
              </span>
              <form
                action={async () => {
                  "use server";
                  await signOut();
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-8 shadow dark:bg-zinc-900">
          <h2 className="text-2xl font-bold text-black dark:text-white">
            Welcome back, {session.user.name || session.user.email}!
          </h2>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            You're successfully logged in. This is a protected page that only authenticated users can access.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
              <h3 className="font-semibold text-black dark:text-white">
                Your Profile
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Email: {session.user.email}
              </p>
              {session.user.name && (
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Name: {session.user.name}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
              <h3 className="font-semibold text-black dark:text-white">
                Account Status
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Status: <span className="text-green-600 dark:text-green-400">Active</span>
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
              <h3 className="font-semibold text-black dark:text-white">
                Quick Actions
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Build your app features here
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
