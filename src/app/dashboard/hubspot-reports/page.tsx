import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import CallsTable from "./CallsTable";

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
    hubspot_owner_id?: string;
  };
}

interface HubSpotEmail {
  id: string;
  properties: {
    hs_email_subject?: string;
    hs_timestamp?: string;
    hs_email_direction?: string;
    hs_email_status?: string;
    hubspot_owner_id?: string;
  };
}

interface HubSpotOwner {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

async function fetchPortalId(): Promise<string | null> {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!accessToken) return null;
  const response = await fetch("https://api.hubapi.com/integrations/v1/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.portalId ? String(data.portalId) : null;
}

async function fetchCallContactIds(callIds: string[]): Promise<Map<string, string>> {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!accessToken || callIds.length === 0) return new Map();

  const map = new Map<string, string>();
  // Batch in chunks of 100 (API limit)
  for (let i = 0; i < callIds.length; i += 100) {
    const chunk = callIds.slice(i, i + 100);
    const response = await fetch(
      "https://api.hubapi.com/crm/v4/associations/calls/contacts/batch/read",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ inputs: chunk.map((id) => ({ id })) }),
        cache: "no-store",
      }
    );
    if (!response.ok) continue;
    const data = await response.json();
    for (const result of data.results ?? []) {
      const contactId = result.to?.[0]?.toObjectId;
      if (contactId) map.set(result.from.id, String(contactId));
    }
  }
  return map;
}

async function fetchOwners(): Promise<Map<string, string>> {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!accessToken) return new Map();

  const response = await fetch("https://api.hubapi.com/crm/v3/owners?limit=100", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) return new Map();

  const data = await response.json();
  const map = new Map<string, string>();
  for (const owner of data.results as HubSpotOwner[]) {
    const name =
      [owner.firstName, owner.lastName].filter(Boolean).join(" ") ||
      owner.email ||
      owner.id;
    map.set(owner.id, name);
  }
  return map;
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
        "hubspot_owner_id",
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

async function fetchHubSpotOutboundEmailsThisMonth(): Promise<HubSpotEmail[]> {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!accessToken) return [];

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let allEmails: HubSpotEmail[] = [];
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
            {
              propertyName: "hs_email_direction",
              operator: "IN",
              values: ["EMAIL", "FORWARDED_EMAIL"],
            },
          ],
        },
      ],
      properties: [
        "hs_email_subject",
        "hs_timestamp",
        "hs_email_direction",
        "hs_email_status",
        "hubspot_owner_id",
      ],
      sorts: [{ propertyName: "hs_timestamp", direction: "DESCENDING" }],
      limit: 100,
    };
    if (after) body.after = after;

    const response = await fetch(
      "https://api.hubapi.com/crm/v3/objects/emails/search",
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
    allEmails = allEmails.concat(data.results || []);
    after = data.paging?.next?.after;
  } while (after);

  return allEmails;
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
  // HubSpot returns hs_timestamp as either ms-as-string or ISO 8601.
  // parseInt on an ISO string only captures the year (e.g. 2026), yielding epoch.
  // Use the numeric value only when it's large enough to be a real ms timestamp.
  const ms = Number(timestamp);
  const d = !isNaN(ms) && ms > 1e10 ? new Date(ms) : new Date(timestamp);
  if (isNaN(d.getTime())) return "Invalid date";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Chicago",
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
  const [calls, outboundEmails, owners, portalId] = await Promise.all([
    fetchHubSpotCallsThisMonth(),
    fetchHubSpotOutboundEmailsThisMonth(),
    fetchOwners(),
    fetchPortalId(),
  ]);

  const callContactIds = await fetchCallContactIds(calls.map((c) => c.id));

  const completedCalls = calls.filter((c) =>
    ["COMPLETED", "CONNECTED"].includes(c.properties.hs_call_status ?? "")
  );
  const inboundCalls = calls.filter(
    (c) => c.properties.hs_call_direction === "INBOUND"
  );
  const outboundCalls = calls.filter(
    (c) => c.properties.hs_call_direction === "OUTBOUND"
  );

  // Group outbound emails by owner
  const emailsByOwner = new Map<string, number>();
  for (const email of outboundEmails) {
    const ownerId = email.properties.hubspot_owner_id ?? "Unassigned";
    const ownerName = ownerId !== "Unassigned" ? (owners.get(ownerId) ?? ownerId) : "Unassigned";
    emailsByOwner.set(ownerName, (emailsByOwner.get(ownerName) ?? 0) + 1);
  }
  const emailsByOwnerSorted = [...emailsByOwner.entries()].sort((a, b) => b[1] - a[1]);

  const now = new Date();
  const monthName = now.toLocaleString("en-US", { month: "long", year: "numeric" });

  const callRows = calls.map((call) => {
    const { label, cls } = statusBadge(call.properties.hs_call_status);
    const ownerName = call.properties.hubspot_owner_id
      ? (owners.get(call.properties.hubspot_owner_id) ?? call.properties.hubspot_owner_id)
      : "—";
    return {
      id: call.id,
      date: formatTimestamp(call.properties.hs_timestamp),
      title: call.properties.hs_call_title || "—",
      user: ownerName,
      direction: call.properties.hs_call_direction
        ? call.properties.hs_call_direction.charAt(0) +
          call.properties.hs_call_direction.slice(1).toLowerCase()
        : "—",
      status: label,
      statusCls: cls,
      duration: formatDuration(call.properties.hs_call_duration),
      from: call.properties.hs_call_from_number || "—",
      to: call.properties.hs_call_to_number || "—",
      hubspotUrl: portalId && callContactIds.get(call.id)
        ? `https://app.hubspot.com/contacts/${portalId}/contact/${callContactIds.get(call.id)}`
        : null,
    };
  });

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-black">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-black dark:text-white">
              HubSpot Reports
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Calls &amp; emails in HubSpot — {monthName}
            </p>
          </div>

          {!hasToken && (
            <div className="mb-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                HubSpot access token not configured. Set the{" "}
                <code className="rounded bg-yellow-100 px-1 dark:bg-yellow-900">
                  HUBSPOT_ACCESS_TOKEN
                </code>{" "}
                environment variable to load live data.
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
                Outbound Calls
              </p>
              <p className="mt-2 text-3xl font-bold text-black dark:text-white">
                {outboundCalls.length}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Inbound Calls
              </p>
              <p className="mt-2 text-3xl font-bold text-black dark:text-white">
                {inboundCalls.length}
              </p>
            </div>
          </div>

          {/* Calls Table */}
          <div className="mb-8 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
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
              <CallsTable rows={callRows} />
            )}
          </div>

          {/* Outbound Emails by Sales Exec */}
          <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-black dark:text-white">
                Outbound Emails by Sales Exec — {monthName}
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {outboundEmails.length} outbound email{outboundEmails.length !== 1 ? "s" : ""} sent this month
              </p>
            </div>

            {outboundEmails.length === 0 ? (
              <div className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                {hasToken
                  ? "No outbound emails found for this month."
                  : "Configure HUBSPOT_ACCESS_TOKEN to see emails."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="px-6 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                        Sales Exec
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                        Emails Sent
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                        % of Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {emailsByOwnerSorted.map(([name, count]) => (
                      <tr
                        key={name}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      >
                        <td className="px-6 py-4 font-medium text-black dark:text-white">
                          {name}
                        </td>
                        <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
                          {count}
                        </td>
                        <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-32 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                              <div
                                className="h-full rounded-full bg-blue-500"
                                style={{
                                  width: `${Math.round((count / outboundEmails.length) * 100)}%`,
                                }}
                              />
                            </div>
                            <span>{Math.round((count / outboundEmails.length) * 100)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
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
