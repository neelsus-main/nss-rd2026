import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import HubSpotSync from "@/components/HubSpotSync";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-black">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-black dark:text-white">
              Settings
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Manage integrations and sync data
            </p>
          </div>

          <div className="space-y-6">
            <HubSpotSync />
          </div>
        </div>
      </main>
    </div>
  );
}
