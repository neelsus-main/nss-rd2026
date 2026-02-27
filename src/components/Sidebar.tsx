"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/dashboard/accounts", label: "Accounts", icon: "🏢" },
  { href: "/dashboard/contacts", label: "Contacts", icon: "👤" },
  { href: "/dashboard/deals", label: "Deals", icon: "💰" },
  { href: "/dashboard/leads", label: "Leads", icon: "🎯" },
  { href: "/dashboard/activities", label: "Activities", icon: "📅" },
  { href: "/dashboard/reports", label: "Reports", icon: "📈" },
  { href: "/dashboard/hubspot-reports", label: "HubSpot Reports", icon: "📞" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex h-16 items-center border-b border-zinc-200 px-6 dark:border-zinc-800">
        <h1 className="text-xl font-bold text-black dark:text-white">CRM</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-zinc-100 text-black dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
