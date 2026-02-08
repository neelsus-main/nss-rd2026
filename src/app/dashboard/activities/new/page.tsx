"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";

const ACTIVITY_TYPES = ["Call", "Email", "Meeting", "Task", "Note"];

function NewActivityForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([]);
  const [contacts, setContacts] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [deals, setDeals] = useState<Array<{ id: string; name: string }>>([]);
  const [leads, setLeads] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [formData, setFormData] = useState({
    type: "Task",
    subject: "",
    description: "",
    dueDate: "",
    accountId: searchParams.get("accountId") || "",
    contactId: searchParams.get("contactId") || "",
    dealId: searchParams.get("dealId") || "",
    leadId: searchParams.get("leadId") || "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/accounts").then((res) => res.json()),
      fetch("/api/contacts").then((res) => res.json()),
      fetch("/api/deals").then((res) => res.json()),
      fetch("/api/leads").then((res) => res.json()),
    ]).then(([accountsData, contactsData, dealsData, leadsData]) => {
      setAccounts(accountsData);
      setContacts(contactsData);
      setDeals(dealsData);
      setLeads(leadsData);
    }).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create activity");
        return;
      }

      // Redirect based on related entity
      if (formData.accountId) {
        router.push(`/dashboard/accounts/${formData.accountId}`);
      } else if (formData.contactId) {
        router.push(`/dashboard/contacts/${formData.contactId}`);
      } else if (formData.dealId) {
        router.push(`/dashboard/deals/${formData.dealId}`);
      } else if (formData.leadId) {
        router.push(`/dashboard/leads/${formData.leadId}`);
      } else {
        router.push("/dashboard/activities");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-black">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link
              href="/dashboard/activities"
              className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
            >
              ← Back to Activities
            </Link>
            <h1 className="mt-4 text-3xl font-bold text-black dark:text-white">
              New Activity
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 text-lg font-semibold text-black dark:text-white">
                Activity Information
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Type *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  >
                    {ACTIVITY_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Account
                  </label>
                  <select
                    value={formData.accountId}
                    onChange={(e) =>
                      setFormData({ ...formData, accountId: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  >
                    <option value="">None</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Contact
                  </label>
                  <select
                    value={formData.contactId}
                    onChange={(e) =>
                      setFormData({ ...formData, contactId: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  >
                    <option value="">None</option>
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.firstName} {contact.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Deal
                  </label>
                  <select
                    value={formData.dealId}
                    onChange={(e) =>
                      setFormData({ ...formData, dealId: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  >
                    <option value="">None</option>
                    {deals.map((deal) => (
                      <option key={deal.id} value={deal.id}>
                        {deal.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Lead
                  </label>
                  <select
                    value={formData.leadId}
                    onChange={(e) =>
                      setFormData({ ...formData, leadId: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  >
                    <option value="">None</option>
                    {leads.map((lead) => (
                      <option key={lead.id} value={lead.id}>
                        {lead.firstName} {lead.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-4">
              <Link
                href="/dashboard/activities"
                className="rounded-lg border border-zinc-300 px-4 py-2 font-medium text-black transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-900"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                {loading ? "Creating..." : "Create Activity"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function NewActivityPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen bg-zinc-50 dark:bg-black">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8">
              <Link
                href="/dashboard/activities"
                className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
              >
                ← Back to Activities
              </Link>
              <h1 className="mt-4 text-3xl font-bold text-black dark:text-white">
                New Activity
              </h1>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
            </div>
          </div>
        </main>
      </div>
    }>
      <NewActivityForm />
    </Suspense>
  );
}
