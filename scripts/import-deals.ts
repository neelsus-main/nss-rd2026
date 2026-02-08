// Load environment variables FIRST before any other imports
import { config } from "dotenv";
import { resolve } from "path";

// Cloud database connection string - use this for imports
const CLOUD_DATABASE_URL = "postgres://759a48bc3e97cf3ed02e5554ef26594a691ddae91214db55dda26194ecaee23e:sk_K3R3AJb9aS4jV_qg_7Fgf@db.prisma.io:5432/postgres?sslmode=require";

// Load .env but override with cloud URL for this import script
config({ path: resolve(process.cwd(), ".env") });
process.env.DATABASE_URL = CLOUD_DATABASE_URL;

import { parse } from "csv-parse/sync";
import { readFileSync } from "fs";
import { join } from "path";

interface DealRow {
  "Record ID": string;
  "Company Hubspot ID for Sync": string;
  "Deal Name": string;
  "Amount": string;
  "Deal Stage": string;
  "Deal probability": string;
  "Close Date": string;
  "Deal Type": string;
  "Solution Type": string;
}

async function importDeals() {
  // Use Pool directly to bypass Prisma client issues
  const { Pool } = await import("pg");
  
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log("Starting deals import...");
    console.log(`DATABASE_URL: ${process.env.DATABASE_URL?.substring(0, 20)}...`);

    // Read the CSV file
    const csvFilePath = join(process.cwd(), "..", "imports", "Deals.csv");
    const fileContent = readFileSync(csvFilePath, "utf-8");

    // Parse CSV
    const records: DealRow[] = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`Found ${records.length} deals in CSV`);

    // First, build a map of Account hubspotRecordId -> Account id for quick lookup
    console.log("Building account lookup map...");
    const accountMapResult = await pool.query(
      'SELECT id, "hubspotRecordId" FROM "Account" WHERE "hubspotRecordId" IS NOT NULL'
    );
    const accountMap = new Map<string, string>();
    for (const account of accountMapResult.rows) {
      if (account.hubspotRecordId) {
        accountMap.set(account.hubspotRecordId, account.id);
      }
    }
    console.log(`Found ${accountMap.size} accounts with Hubspot IDs`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;
    let noAccountMatch = 0;

    // Process each record
    for (const record of records) {
      try {
        const dealName = record["Deal Name"]?.trim();
        const hubspotRecordId = record["Record ID"]?.trim();
        const companyHubspotId = record["Company Hubspot ID for Sync"]?.trim();

        // Skip if no deal name
        if (!dealName) {
          console.warn(`Skipping record with no deal name`);
          skipped++;
          continue;
        }

        // Find the account by matching Hubspot Company ID
        let accountId: string | null = null;
        if (companyHubspotId) {
          accountId = accountMap.get(companyHubspotId) || null;
          if (!accountId) {
            noAccountMatch++;
            console.warn(`No account found for Hubspot Company ID: ${companyHubspotId} (Deal: ${dealName})`);
          }
        }

        // Parse amount - handle empty or invalid values
        let amount = 0;
        const amountStr = record["Amount"]?.trim();
        if (amountStr) {
          const parsedAmount = parseFloat(amountStr);
          if (!isNaN(parsedAmount)) {
            amount = parsedAmount;
          }
        }

        // Parse probability - convert to 0-100 integer
        let probability = 0;
        const probabilityStr = record["Deal probability"]?.trim();
        if (probabilityStr) {
          const parsedProb = parseFloat(probabilityStr);
          if (!isNaN(parsedProb)) {
            // If it's a decimal (0-1), convert to percentage (0-100)
            probability = parsedProb <= 1 ? Math.round(parsedProb * 100) : Math.round(parsedProb);
            probability = Math.max(0, Math.min(100, probability)); // Clamp to 0-100
          }
        }

        // Parse stage - use Deal Stage or default to "Prospecting"
        let stage = record["Deal Stage"]?.trim() || "Prospecting";
        // Map common stage values if needed
        if (stage && typeof stage === "string") {
          // Keep the stage as-is, but ensure it's a valid string
          stage = stage.substring(0, 100); // Limit length
        } else {
          stage = "Prospecting";
        }

        // Parse close date
        let closeDate: Date | null = null;
        const closeDateStr = record["Close Date"]?.trim();
        if (closeDateStr) {
          try {
            // Try parsing various date formats
            const parsedDate = new Date(closeDateStr);
            if (!isNaN(parsedDate.getTime())) {
              closeDate = parsedDate;
            }
          } catch (e) {
            // Invalid date, leave as null
          }
        }

        // Create deal using raw SQL
        const insertSQL = `
          INSERT INTO "Deal" (id, name, amount, stage, probability, "closeDate", "hubspotRecordId", "accountId", "createdAt", "updatedAt")
          VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          ON CONFLICT ("hubspotRecordId") DO NOTHING
        `;
        
        const result = await pool.query(insertSQL, [
          dealName,
          amount,
          stage,
          probability,
          closeDate,
          hubspotRecordId || null,
          accountId,
        ]);

        // Check if row was actually inserted (not skipped due to conflict)
        if (result.rowCount && result.rowCount > 0) {
          imported++;
          if (imported % 50 === 0) {
            console.log(`Imported ${imported} deals...`);
          }
        } else {
          skipped++; // Duplicate hubspotRecordId
        }
      } catch (error: any) {
        // Check if it's a unique constraint violation
        if (error.code === "23505" || error.message?.includes("Unique constraint") || error.message?.includes("duplicate")) {
          console.log(`Skipping duplicate deal: ${record["Deal Name"]}`);
          skipped++;
        } else {
          // Log full error for first few to debug
          if (errors < 3) {
            console.error(`Error importing deal: ${record["Deal Name"]}`);
            console.error("Full error:", JSON.stringify(error, null, 2));
          } else {
            console.error(`Error importing deal: ${record["Deal Name"]}`, error.message?.substring(0, 200));
          }
          errors++;
        }
      }
    }

    console.log("\n=== Import Summary ===");
    console.log(`Total records: ${records.length}`);
    console.log(`Imported: ${imported}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`No account match: ${noAccountMatch}`);
    console.log(`Errors: ${errors}`);
  } catch (error) {
    console.error("Import failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the import
importDeals();
