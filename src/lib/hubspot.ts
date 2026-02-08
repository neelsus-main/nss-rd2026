import { Client } from "@hubspot/api-client";

if (!process.env.HUBSPOT_API_KEY) {
  console.warn("HUBSPOT_API_KEY is not set. HubSpot integration will not work.");
}

export const hubspotClient = process.env.HUBSPOT_API_KEY
  ? new Client({ accessToken: process.env.HUBSPOT_API_KEY })
  : null;

// HubSpot to CRM field mappings
export const mapHubSpotCompanyToAccount = (company: any) => {
  return {
    name: company.properties.name || "",
    website: company.properties.domain || null,
    industry: company.properties.industry || null,
    phone: company.properties.phone || null,
    email: company.properties.email || null,
    billingStreet: company.properties.address || null,
    billingCity: company.properties.city || null,
    billingState: company.properties.state || null,
    billingZip: company.properties.zip || null,
    billingCountry: company.properties.country || null,
    description: company.properties.description || null,
    annualRevenue: company.properties.annualrevenue
      ? parseFloat(company.properties.annualrevenue)
      : null,
    employeeCount: company.properties.numberofemployees
      ? parseInt(company.properties.numberofemployees)
      : null,
    hubspotId: company.id, // Store HubSpot ID for future sync
  };
};

export const mapHubSpotContactToContact = (contact: any) => {
  const firstName = contact.properties.firstname || "";
  const lastName = contact.properties.lastname || "";
  
  return {
    firstName,
    lastName,
    email: contact.properties.email || null,
    phone: contact.properties.phone || null,
    mobile: contact.properties.mobilephone || null,
    title: contact.properties.jobtitle || null,
    department: contact.properties.department || null,
    mailingStreet: contact.properties.address || null,
    mailingCity: contact.properties.city || null,
    mailingState: contact.properties.state || null,
    mailingZip: contact.properties.zip || null,
    mailingCountry: contact.properties.country || null,
    hubspotId: contact.id,
    hubspotCompanyId: contact.associations?.companies?.results?.[0]?.id || null,
  };
};

export const mapHubSpotDealToDeal = (deal: any) => {
  return {
    name: deal.properties.dealname || "",
    amount: deal.properties.amount
      ? parseFloat(deal.properties.amount)
      : 0,
    stage: mapHubSpotDealStage(deal.properties.dealstage) || "Prospecting",
    probability: deal.properties.hs_probability
      ? parseInt(deal.properties.hs_probability)
      : 0,
    closeDate: deal.properties.closedate
      ? new Date(deal.properties.closedate)
      : null,
    hubspotId: deal.id,
    hubspotCompanyId: deal.associations?.companies?.results?.[0]?.id || null,
    hubspotContactIds: deal.associations?.contacts?.results?.map((c: any) => c.id) || [],
  };
};

const mapHubSpotDealStage = (stage: string): string => {
  const stageMap: Record<string, string> = {
    appointmentscheduled: "Qualification",
    qualifiedtobuy: "Qualification",
    presentationscheduled: "Proposal",
    decisionmakerboughtin: "Proposal",
    contractsent: "Negotiation",
    closedwon: "Closed Won",
    closedlost: "Closed Lost",
  };

  // Try to find a match (case-insensitive)
  const lowerStage = stage?.toLowerCase() || "";
  for (const [key, value] of Object.entries(stageMap)) {
    if (lowerStage.includes(key)) {
      return value;
    }
  }

  // Default mapping
  if (lowerStage.includes("won")) return "Closed Won";
  if (lowerStage.includes("lost")) return "Closed Lost";
  if (lowerStage.includes("negotiation")) return "Negotiation";
  if (lowerStage.includes("proposal")) return "Proposal";
  if (lowerStage.includes("qualification")) return "Qualification";

  return "Prospecting";
};
