"use client";

import { useState } from "react";

export default function HubSpotSync() {
  const [loading, setLoading] = useState(false);
  const [syncType, setSyncType] = useState<"all" | "accounts" | "contacts" | "deals">("all");
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSync = async () => {
    setLoading(true);
    setError("");
    setResults(null);

    try {
      const response = await fetch("/api/hubspot/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncType }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to sync from HubSpot");
        return;
      }

      setResults(data.results);
    } catch (err) {
      setError("An error occurred while syncing. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-black dark:text-white">
          HubSpot Integration
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Sync your HubSpot data into the CRM. Make sure HUBSPOT_API_KEY is set in your environment variables.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Sync Type
          </label>
          <select
            value={syncType}
            onChange={(e) => setSyncType(e.target.value as any)}
            disabled={loading}
            className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white disabled:opacity-50"
          >
            <option value="all">All (Accounts, Contacts, Deals)</option>
            <option value="accounts">Accounts Only</option>
            <option value="contacts">Contacts Only</option>
            <option value="deals">Deals Only</option>
          </select>
        </div>

        <button
          onClick={handleSync}
          disabled={loading}
          className="w-full rounded-lg bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {loading ? "Syncing..." : "Sync from HubSpot"}
        </button>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {results && (
          <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
            <h3 className="mb-2 font-semibold text-green-800 dark:text-green-400">
              Sync Results
            </h3>
            <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
              <div>
                <strong>Accounts:</strong> {results.accounts.created} created,{" "}
                {results.accounts.updated} updated, {results.accounts.errors} errors
              </div>
              <div>
                <strong>Contacts:</strong> {results.contacts.created} created,{" "}
                {results.contacts.updated} updated, {results.contacts.errors} errors
              </div>
              <div>
                <strong>Deals:</strong> {results.deals.created} created,{" "}
                {results.deals.updated} updated, {results.deals.errors} errors
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
