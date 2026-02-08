import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { hubspotClient, mapHubSpotCompanyToAccount, mapHubSpotContactToContact, mapHubSpotDealToDeal } from "@/lib/hubspot";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hubspotClient) {
      return NextResponse.json(
        { error: "HubSpot API key not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { syncType = "all" } = body; // "all", "accounts", "contacts", "deals"

    const results = {
      accounts: { created: 0, updated: 0, errors: 0 },
      contacts: { created: 0, updated: 0, errors: 0 },
      deals: { created: 0, updated: 0, errors: 0 },
    };

    // Sync Companies (Accounts)
    if (syncType === "all" || syncType === "accounts") {
      try {
        const companiesResponse = await hubspotClient.crm.companies.basicApi.getPage(
          100, // limit
          undefined, // after (pagination)
          ["name", "domain", "industry", "phone", "email", "address", "city", "state", "zip", "country", "description", "annualrevenue", "numberofemployees"]
        );

        for (const company of companiesResponse.results) {
          try {
            const accountData = mapHubSpotCompanyToAccount(company);
            
            // Check if account already exists by HubSpot ID (if we stored it)
            // For now, we'll try to match by name
            const existing = await prisma.account.findFirst({
              where: { name: accountData.name },
            });

            if (existing) {
              await prisma.account.update({
                where: { id: existing.id },
                data: {
                  ...accountData,
                  hubspotId: undefined, // Remove from update data
                },
              });
              results.accounts.updated++;
            } else {
              await prisma.account.create({
                data: {
                  ...accountData,
                  ownerId: session.user.id,
                },
              });
              results.accounts.created++;
            }
          } catch (error) {
            console.error(`Error syncing company ${company.id}:`, error);
            results.accounts.errors++;
          }
        }
      } catch (error) {
        console.error("Error fetching companies from HubSpot:", error);
        return NextResponse.json(
          { error: "Failed to sync companies from HubSpot", details: String(error) },
          { status: 500 }
        );
      }
    }

    // Sync Contacts
    if (syncType === "all" || syncType === "contacts") {
      try {
        const contactsResponse = await hubspotClient.crm.contacts.basicApi.getPage(
          100,
          undefined,
          ["firstname", "lastname", "email", "phone", "mobilephone", "jobtitle", "department", "address", "city", "state", "zip", "country"],
          ["companies"]
        );

        // First, get all accounts to map HubSpot company IDs
        const accounts = await prisma.account.findMany();
        const hubspotAccountMap = new Map<string, string>();
        // Note: We'd need to store hubspotId in Account model to properly map
        // For now, we'll skip company association

        for (const contact of contactsResponse.results) {
          try {
            const contactData = mapHubSpotContactToContact(contact);
            
            // Find existing contact by email or name
            const existing = await prisma.contact.findFirst({
              where: {
                OR: [
                  { email: contactData.email || undefined },
                  {
                    AND: [
                      { firstName: contactData.firstName },
                      { lastName: contactData.lastName },
                    ],
                  },
                ],
              },
            });

            // Find associated account if we have the company ID
            let accountId = null;
            if (contactData.hubspotCompanyId) {
              // Try to find account by HubSpot company ID
              // For now, skip this mapping - would need hubspotId field in Account
            }

            if (existing) {
              await prisma.contact.update({
                where: { id: existing.id },
                data: {
                  ...contactData,
                  accountId: accountId || existing.accountId,
                  hubspotId: undefined,
                  hubspotCompanyId: undefined,
                },
              });
              results.contacts.updated++;
            } else {
              await prisma.contact.create({
                data: {
                  ...contactData,
                  accountId,
                  ownerId: session.user.id,
                  hubspotId: undefined,
                  hubspotCompanyId: undefined,
                },
              });
              results.contacts.created++;
            }
          } catch (error) {
            console.error(`Error syncing contact ${contact.id}:`, error);
            results.contacts.errors++;
          }
        }
      } catch (error) {
        console.error("Error fetching contacts from HubSpot:", error);
        return NextResponse.json(
          { error: "Failed to sync contacts from HubSpot", details: String(error) },
          { status: 500 }
        );
      }
    }

    // Sync Deals
    if (syncType === "all" || syncType === "deals") {
      try {
        const dealsResponse = await hubspotClient.crm.deals.basicApi.getPage(
          100,
          undefined,
          ["dealname", "amount", "dealstage", "hs_probability", "closedate"],
          ["companies", "contacts"]
        );

        // Get all accounts and contacts for mapping
        const accounts = await prisma.account.findMany();
        const contacts = await prisma.contact.findMany();

        for (const deal of dealsResponse.results) {
          try {
            const dealData = mapHubSpotDealToDeal(deal);
            
            // Find existing deal by name
            const existing = await prisma.deal.findFirst({
              where: { name: dealData.name },
            });

            // Find associated account
            let accountId = null;
            if (dealData.hubspotCompanyId) {
              // Would need hubspotId in Account model to map properly
              // For now, skip
            }

            // Find associated contacts
            const contactIds: string[] = [];
            if (dealData.hubspotContactIds && dealData.hubspotContactIds.length > 0) {
              // Would need hubspotId in Contact model to map properly
              // For now, skip
            }

            if (existing) {
              await prisma.deal.update({
                where: { id: existing.id },
                data: {
                  ...dealData,
                  accountId: accountId || existing.accountId,
                  hubspotId: undefined,
                  hubspotCompanyId: undefined,
                  hubspotContactIds: undefined,
                },
              });
              results.deals.updated++;
            } else {
              const createdDeal = await prisma.deal.create({
                data: {
                  ...dealData,
                  accountId,
                  ownerId: session.user.id,
                  hubspotId: undefined,
                  hubspotCompanyId: undefined,
                  hubspotContactIds: undefined,
                  contacts: contactIds.length > 0
                    ? {
                        create: contactIds.map((contactId) => ({
                          contactId,
                        })),
                      }
                    : undefined,
                },
              });
              results.deals.created++;
            }
          } catch (error) {
            console.error(`Error syncing deal ${deal.id}:`, error);
            results.deals.errors++;
          }
        }
      } catch (error) {
        console.error("Error fetching deals from HubSpot:", error);
        return NextResponse.json(
          { error: "Failed to sync deals from HubSpot", details: String(error) },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: "Sync completed",
    });
  } catch (error) {
    console.error("Error syncing from HubSpot:", error);
    return NextResponse.json(
      { error: "Failed to sync from HubSpot", details: String(error) },
      { status: 500 }
    );
  }
}
