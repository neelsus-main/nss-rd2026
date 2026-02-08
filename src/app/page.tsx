import Link from "next/link";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col items-center gap-8 px-8 py-16 text-center">
        <div>
          <h1 className="text-5xl font-bold tracking-tight text-black dark:text-white">
            Welcome to Your App
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            A modern web application with authentication
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          {session?.user ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-black px-8 py-3 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg bg-black px-8 py-3 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-lg border border-zinc-300 px-8 py-3 font-medium text-black transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-900"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 p-6 text-left dark:border-zinc-800">
            <h3 className="font-semibold text-black dark:text-white">
              🔐 Secure Auth
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Built with NextAuth.js and bcrypt password hashing
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 p-6 text-left dark:border-zinc-800">
            <h3 className="font-semibold text-black dark:text-white">
              💾 Database
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Powered by Prisma and PostgreSQL
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 p-6 text-left dark:border-zinc-800">
            <h3 className="font-semibold text-black dark:text-white">
              ⚡ Fast Deploy
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Auto-deployed on Vercel with CI/CD
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
