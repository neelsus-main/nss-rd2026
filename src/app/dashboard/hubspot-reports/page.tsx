import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import Sidebar from "@/components/Sidebar";
import CallsTable from "./CallsTable";
import DateFilter from "./DateFilter";
import UserFilter from "./UserFilter";

interface HubSpotCall {
  id: string;
  properties: {
    hs_call_title?: string;
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
    hs_timestamp?: string;
    hs_email_direction?: string;
    hubspot_owner_id?: string;
  };
}

interface HubSpotOwner {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const PAGE_DELAY_MS = 500;
const MAX_RETRIES = 3;

async function hubspotFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(input, { ...init, cache: "no-store" });
    if (response.status !== 429) return response;
    const retryAfter = response.headers.get("Retry-After");
    const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : 1000 * (attempt + 1);
    if (attempt === MAX_RETRIES) return response;
    await sleep(waitMs);
  }
  // unreachable, but satisfies TS
  return fetch(input, init);
}

async function fetchOwners(): Promise<{ data: Record<string, string>; error?: string }> {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!accessToken) return { data: {} };

  const map: Record<string, string> = {};
  let after: string | undefined;

  do {
    const url = new URL("https://api.hubapi.com/crm/v3/owners");
    url.searchParams.set("limit", "100");
    if (after) url.searchParams.set("after", after);

    const response = await hubspotFetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      return { data: map, error: `Owners API error ${response.status}: ${response.statusText}` };
    }

    const data = await response.json();
    for (const owner of data.results as HubSpotOwner[]) {
      const name =
        [owner.firstName, owner.lastName].filter(Boolean).join(" ") ||
        owner.email ||
        owner.id;
      map[owner.id] = name;
    }
    after = data.paging?.next?.after;
    if (after) await sleep(PAGE_DELAY_MS);
  } while (after);

  return { data: map };
}

async function fetchHubSpotCalls(
  startMs: number,
  endMs: number,
): Promise<{ data: HubSpotCall[]; error?: string }> {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!accessToken) return { data: [] };

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
              value: startMs.toString(),
            },
            {
              propertyName: "hs_timestamp",
              operator: "LTE",
              value: endMs.toString(),
            },
          ],
        },
      ],
      properties: [
        "hs_call_title",
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

    const response = await hubspotFetch(
      "https://api.hubapi.com/crm/v3/objects/calls/search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      return { data: allCalls, error: `Calls API error ${response.status}: ${response.statusText}` };
    }

    const data = await response.json();
    allCalls = allCalls.concat(data.results || []);
    after = data.paging?.next?.after;
    if (after) await sleep(PAGE_DELAY_MS);
  } while (after);

  return { data: allCalls };
}

async function fetchHubSpotOutboundEmails(
  startMs: number,
  endMs: number,
): Promise<{ data: HubSpotEmail[]; error?: string }> {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!accessToken) return { data: [] };

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
              value: startMs.toString(),
            },
            {
              propertyName: "hs_timestamp",
              operator: "LTE",
              value: endMs.toString(),
            },
            {
              propertyName: "hs_email_direction",
              operator: "IN",
              values: ["EMAIL", "FORWARDED_EMAIL", "REPLY_TO_EMAIL"],
            },
          ],
        },
      ],
      properties: [
        "hs_timestamp",
        "hs_email_direction",
        "hubspot_owner_id",
      ],
      sorts: [{ propertyName: "hs_timestamp", direction: "DESCENDING" }],
      limit: 100,
    };
    if (after) body.after = after;

    const response = await hubspotFetch(
      "https://api.hubapi.com/crm/v3/objects/emails/search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      return { data: allEmails, error: `Emails API error ${response.status}: ${response.statusText}` };
    }

    const data = await response.json();
    allEmails = allEmails.concat(data.results || []);
    after = data.paging?.next?.after;
    if (after) await sleep(PAGE_DELAY_MS);
  } while (after);

  return { data: allEmails };
}

interface CachedHubSpotData {
  owners: Record<string, string>;
  ownersError?: string;
  calls: HubSpotCall[];
  callsError?: string;
  emails: HubSpotEmail[];
  emailsError?: string;
}

async function fetchAllHubSpotData(startMs: number, endMs: number): Promise<CachedHubSpotData> {
  // Run fetchers sequentially to avoid exceeding HubSpot's rate limit
  const ownersResult = await fetchOwners();
  const callsResult = await fetchHubSpotCalls(startMs, endMs);
  const emailsResult = await fetchHubSpotOutboundEmails(startMs, endMs);

  return {
    owners: ownersResult.data,
    ownersError: ownersResult.error,
    calls: callsResult.data,
    callsError: callsResult.error,
    emails: emailsResult.data,
    emailsError: emailsResult.error,
  };
}

const getCachedHubSpotData = unstable_cache(
  fetchAllHubSpotData,
  ["hubspot-reports"],
  { revalidate: 60 }
);

function formatDuration(ms?: string): string {
  if (!ms || ms === "0") return "—";
  const totalSeconds = Math.floor(parseInt(ms) / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
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

function formatRangeLabel(from: string, to: string): string {
  const fmt = (s: string) =>
    new Date(s + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  return `${fmt(from)} – ${fmt(to)}`;
}

function defaultDateRange(): { from: string; to: string } {
  const today = new Date();
  const past30 = new Date(today);
  past30.setDate(past30.getDate() - 30);
  return {
    from: past30.toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10),
  };
}

export default async function HubSpotReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; user?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const defaults = defaultDateRange();
  const from = params.from || defaults.from;
  const to = params.to || defaults.to;
  const selectedUserId = params.user || "";

  // Convert date strings to ms timestamps for API filters
  const startMs = new Date(from + "T00:00:00").getTime();
  const endMs = new Date(to + "T23:59:59.999").getTime();

  const hasToken = !!process.env.HUBSPOT_ACCESS_TOKEN;
  const hubspotData = await getCachedHubSpotData(startMs, endMs);

  const allCalls = hubspotData.calls;
  const allOutboundEmails = hubspotData.emails;
  const owners = hubspotData.owners;

  const apiErrors = [hubspotData.callsError, hubspotData.emailsError, hubspotData.ownersError].filter(
    (e): e is string => !!e
  );

  // Build sorted owners list for the dropdown
  const ownersList = Object.entries(owners)
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Filter by selected salesperson
  const calls = selectedUserId
    ? allCalls.filter((c) => c.properties.hubspot_owner_id === selectedUserId)
    : allCalls;
  const outboundEmails = selectedUserId
    ? allOutboundEmails.filter((e) => e.properties.hubspot_owner_id === selectedUserId)
    : allOutboundEmails;

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
  const emailsByOwner: Record<string, number> = {};
  for (const email of outboundEmails) {
    const ownerId = email.properties.hubspot_owner_id ?? "Unassigned";
    const ownerName = ownerId !== "Unassigned" ? (owners[ownerId] ?? ownerId) : "Unassigned";
    emailsByOwner[ownerName] = (emailsByOwner[ownerName] ?? 0) + 1;
  }
  const emailsByOwnerSorted = Object.entries(emailsByOwner).sort((a, b) => b[1] - a[1]);

  const rangeLabel = formatRangeLabel(from, to);

  const callRows = calls.map((call) => {
    const { label, cls } = statusBadge(call.properties.hs_call_status);
    const ownerName = call.properties.hubspot_owner_id
      ? (owners[call.properties.hubspot_owner_id] ?? call.properties.hubspot_owner_id)
      : "—";
    return {
      id: call.id,
      timestamp: call.properties.hs_timestamp ? new Date(call.properties.hs_timestamp).getTime() : 0,
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
    };
  });

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
              Calls &amp; emails in HubSpot — {rangeLabel}
            </p>
          </div>

          <div className="mb-8 flex flex-wrap items-end gap-4">
            <DateFilter from={from} to={to} />
            <UserFilter owners={ownersList} selectedUserId={selectedUserId} />
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

          {apiErrors.length > 0 && (
            <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
              <p className="mb-1 text-sm font-semibold text-red-800 dark:text-red-200">
                HubSpot API errors — data may be incomplete:
              </p>
              <ul className="list-inside list-disc space-y-0.5 text-sm text-red-700 dark:text-red-300">
                {apiErrors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
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
                All Calls
              </h2>
            </div>

            {calls.length === 0 ? (
              <div className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                {hasToken
                  ? "No calls found for this period."
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
                Outbound Emails by Sales Exec
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {outboundEmails.length} outbound email{outboundEmails.length !== 1 ? "s" : ""} sent
              </p>
            </div>

            {outboundEmails.length === 0 ? (
              <div className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                {hasToken
                  ? "No outbound emails found for this period."
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
