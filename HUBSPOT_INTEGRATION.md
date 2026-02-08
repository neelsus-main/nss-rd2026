# HubSpot Integration Guide

## Overview
This CRM includes a HubSpot integration that allows you to sync data from HubSpot into your CRM database.

## Setup

### 1. Get Your HubSpot API Key

1. Log in to your HubSpot account
2. Go to **Settings** → **Integrations** → **Private Apps**
3. Click **Create a private app**
4. Give it a name (e.g., "CRM Sync")
5. Under **Scopes**, grant the following permissions:
   - **CRM** → Read access to:
     - Companies
     - Contacts
     - Deals
6. Click **Create app**
7. Copy the **API Key** (starts with `pat-`)

### 2. Add API Key to Environment Variables

**For Local Development:**
Create a `.env.local` file in the `web/` directory:
```
HUBSPOT_API_KEY=your-api-key-here
```

**For Vercel:**
1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add:
   - Key: `HUBSPOT_API_KEY`
   - Value: Your HubSpot API key
   - Environment: Production, Preview, Development (as needed)
4. Redeploy your application

## Usage

### Syncing Data

1. Log in to your CRM
2. Navigate to **Settings** (⚙️ in the sidebar)
3. In the **HubSpot Integration** section:
   - Select what to sync:
     - **All**: Syncs Accounts, Contacts, and Deals
     - **Accounts Only**: Syncs only Companies from HubSpot
     - **Contacts Only**: Syncs only Contacts from HubSpot
     - **Deals Only**: Syncs only Deals from HubSpot
4. Click **Sync from HubSpot**
5. Wait for the sync to complete
6. Review the results showing how many records were created, updated, or had errors

### Data Mapping

**HubSpot Companies → CRM Accounts:**
- `name` → Account Name
- `domain` → Website
- `industry` → Industry
- `phone` → Phone
- `email` → Email
- `address` → Billing Street
- `city` → Billing City
- `state` → Billing State
- `zip` → Billing ZIP
- `country` → Billing Country
- `description` → Description
- `annualrevenue` → Annual Revenue
- `numberofemployees` → Employee Count

**HubSpot Contacts → CRM Contacts:**
- `firstname` → First Name
- `lastname` → Last Name
- `email` → Email
- `phone` → Phone
- `mobilephone` → Mobile
- `jobtitle` → Title
- `department` → Department
- `address` → Mailing Street
- `city` → Mailing City
- `state` → Mailing State
- `zip` → Mailing ZIP
- `country` → Mailing Country

**HubSpot Deals → CRM Deals:**
- `dealname` → Deal Name
- `amount` → Amount
- `dealstage` → Stage (mapped to CRM stages)
- `hs_probability` → Probability
- `closedate` → Close Date

### Stage Mapping

HubSpot deal stages are automatically mapped to CRM stages:
- `appointmentscheduled`, `qualifiedtobuy` → Qualification
- `presentationscheduled`, `decisionmakerboughtin` → Proposal
- `contractsent` → Negotiation
- `closedwon` → Closed Won
- `closedlost` → Closed Lost
- Default → Prospecting

## How It Works

1. The sync API (`/api/hubspot/sync`) fetches data from HubSpot using the official HubSpot API client
2. Data is transformed using mapping functions to match your CRM schema
3. Records are created or updated in your database:
   - **Accounts**: Matched by name
   - **Contacts**: Matched by email or name
   - **Deals**: Matched by name
4. All synced records are assigned to the user who initiated the sync

## Limitations

- **Pagination**: Currently syncs up to 100 records per entity type. For larger datasets, you may need to run multiple syncs or implement pagination.
- **Relationships**: Company-to-Account and Contact-to-Deal associations are not automatically mapped (would require storing HubSpot IDs in your database).
- **Updates**: Records are matched by name/email, so if these change in HubSpot, new records may be created instead of updating existing ones.

## Future Enhancements

- Store HubSpot IDs in database for better matching
- Implement two-way sync (push changes back to HubSpot)
- Add incremental sync (only sync changed records)
- Support for custom properties mapping
- Automatic scheduled syncs

## Troubleshooting

**Error: "HubSpot API key not configured"**
- Make sure `HUBSPOT_API_KEY` is set in your environment variables
- Restart your development server after adding the variable
- For Vercel, make sure to redeploy after adding the variable

**Error: "Failed to sync from HubSpot"**
- Check that your API key has the correct permissions
- Verify your HubSpot account is active
- Check the server logs for detailed error messages

**No data synced**
- Verify you have data in HubSpot
- Check that the API key has read permissions for the entities you're trying to sync
- Review the sync results for error counts
