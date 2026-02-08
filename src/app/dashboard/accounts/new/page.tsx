"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";

export default function NewAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    website: "",
    industry: "",
    phone: "",
    email: "",
    billingStreet: "",
    billingCity: "",
    billingState: "",
    billingZip: "",
    billingCountry: "",
    description: "",
    annualRevenue: "",
    employeeCount: "",
    hubspotRecordId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create account");
        return;
      }

      router.push(`/dashboard/accounts/${data.id}`);
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
              href="/dashboard/accounts"
              className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
            >
              ← Back to Accounts
            </Link>
            <h1 className="mt-4 text-3xl font-bold text-black dark:text-white">
              New Account
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 text-lg font-semibold text-black dark:text-white">
                Account Information
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Account Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) =>
                      setFormData({ ...formData, industry: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Annual Revenue
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.annualRevenue}
                    onChange={(e) =>
                      setFormData({ ...formData, annualRevenue: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Employee Count
                  </label>
                  <input
                    type="number"
                    value={formData.employeeCount}
                    onChange={(e) =>
                      setFormData({ ...formData, employeeCount: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Hubspot Record ID
                  </label>
                  <input
                    type="text"
                    value={formData.hubspotRecordId}
                    onChange={(e) =>
                      setFormData({ ...formData, hubspotRecordId: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    placeholder="Optional"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 text-lg font-semibold text-black dark:text-white">
                Billing Address
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Street
                  </label>
                  <input
                    type="text"
                    value={formData.billingStreet}
                    onChange={(e) =>
                      setFormData({ ...formData, billingStreet: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.billingCity}
                    onChange={(e) =>
                      setFormData({ ...formData, billingCity: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.billingState}
                    onChange={(e) =>
                      setFormData({ ...formData, billingState: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={formData.billingZip}
                    onChange={(e) =>
                      setFormData({ ...formData, billingZip: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.billingCountry}
                    onChange={(e) =>
                      setFormData({ ...formData, billingCountry: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
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
                href="/dashboard/accounts"
                className="rounded-lg border border-zinc-300 px-4 py-2 font-medium text-black transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-900"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                {loading ? "Creating..." : "Create Account"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
