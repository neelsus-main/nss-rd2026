import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";

interface HubSpotCall {
  id: string;
  properties: {
    hs_call_title?: string;
    hs_call_body?: string;
    hs_call_duration?: string;
    hs_call_direction?: string;
    hs_call_status?: string;
    hs_timestamp?: string;
    hs_call_to_number?: string;
    hs_call_from_number?: string;
  };
}

async function fetchHubSpotCallsThisMonth(): Promise<HubSpotCall[]> {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!accessToken) return [];

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let allCalls: HubSpotCall[] = [];
  let after: string | undefined;

  do {
    const body: Record<string, unknown> = {
      filterGroups: [
        {
          filters: [
            {
              propertyName: "hs_timestamp",
              operator: "GTE",
              value: startOfMonth.getTime().toString(),
            },
          ],
        },
      ],
      properties: [
        "hs_call_title",
        "hs_call_body",
        "hs_call_duration",
        "hs_call_direction",
        "hs_call_status",
        "hs_timestamp",
        "hs_call_to_number",
        "hs_call_from_number",
      ],
      sorts: [{ propertyName: "hs_timestamp", direction: "DESCENDING" }],
      limit: 100,
    };
    if (after) body.after = after;

    const response = await fetch(
      "https://api.hubapi.com/crm/v3/objects/calls/search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );

    if (!response.ok) break;

    const data = await response.json();
    allCalls = allCalls.concat(data.results || []);
    after = data.paging?.next?.after;
  } while (after);

  return allCalls;
}

function formatDuration(ms?: string): string {
  if (!ms || ms === "0") return "—";
  const totalSeconds = Math.floor(parseInt(ms) / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function formatTimestamp(timestamp?: string): string {
  if (!timestamp) return "—";
  return new Date(parseInt(timestamp)).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function statusBadge(status?: string) {
  const map: Record<string, string> = {
    COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    CONNECTED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    MISSED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    NO_ANSWER: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    BUSY: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    FAILED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    CANCELED: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  };
  const label = status?.replace(/_/g, " ") ?? "—";
  const cls = map[status ?? ""] ?? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  return { label, cls };
}

export default async function HubSpotReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const hasToken = !!process.env.HUBSPOT_ACCESS_TOKEN;
  const calls = await fetchHubSpotCallsThisMonth();

  const completedCalls = calls.filter((c) =>
    ["COMPLETED", "CONNECTED"].includes(c.properties.hs_call_status ?? "")
  );
  const inboundCalls = calls.filter(
    (c) => c.properties.hs_call_direction === "INBOUND"
  );
  const outboundCalls = calls.filter(
    (c) => c.properties.hs_call_direction === "OUTBOUND"
  );

  const now = new Date();
  const monthName = now.toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-black">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-black dark:text-white">
              HubSpot Reports
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Calls made in HubSpot — {monthName}
            </p>
          </div>

          {!hasToken && (
            <div className="mb-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                HubSpot access token not configured. Set the{" "}
                <code className="rounded bg-yellow-100 px-1 dark:bg-yellow-900">
                  HUBSPOT_ACCESS_TOKEN
                </code>{" "}
                environment variable to load live call data.
              </p>
            </div>
          )}

          {/* Summary Cards */}
          <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Total Calls
              </p>
              <p className="mt-2 text-3xl font-bold text-black dark:text-white">
                {calls.length}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Completed
              </p>
              <p className="mt-2 text-3xl font-bold text-black dark:text-white">
                {completedCalls.length}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Outbound
              </p>
              <p className="mt-2 text-3xl font-bold text-black dark:text-white">
                {outboundCalls.length}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Inbound
              </p>
              <p className="mt-2 text-3xl font-bold text-black dark:text-white">
                {inboundCalls.length}
              </p>
            </div>
          </div>

          {/* Calls Table */}
          <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-black dark:text-white">
                All Calls This Month
              </h2>
            </div>

            {calls.length === 0 ? (
              <div className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                {hasToken
                  ? "No calls found for this month."
                  : "Configure HUBSPOT_ACCESS_TOKEN to see calls."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="px-6 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                        Direction
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                        From
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                        To
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {calls.map((call) => {
                      const { label, cls } = statusBadge(
                        call.properties.hs_call_status
                      );
                      return (
                        <tr
                          key={call.id}
                          className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        >
                          <td className="whitespace-nowrap px-6 py-4 text-zinc-700 dark:text-zinc-300">
                            {formatTimestamp(call.properties.hs_timestamp)}
                          </td>
                          <td className="max-w-[200px] truncate px-6 py-4 font-medium text-black dark:text-white">
                            {call.properties.hs_call_title || "—"}
                          </td>
                          <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
                            {call.properties.hs_call_direction
                              ? call.properties.hs_call_direction.charAt(0) +
                                call.properties.hs_call_direction
                                  .slice(1)
                                  .toLowerCase()
                              : "—"}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
                            >
                              {label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
                            {formatDuration(call.properties.hs_call_duration)}
                          </td>
                          <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
                            {call.properties.hs_call_from_number || "—"}
                          </td>
                          <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
                            {call.properties.hs_call_to_number || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
