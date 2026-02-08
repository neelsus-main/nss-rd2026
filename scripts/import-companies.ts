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

interface CompanyRow {
  "DQ: Exceptions": string;
  "QB Date Created": string;
  "QB Date Modified": string;
  "Record ID": string;
  "Create Date": string;
  "Company name": string;
  "Company Domain Name": string;
  Industry: string;
  "Number of Associated Contacts": string;
  "Number of Associated Deals": string;
  "Number of Deals Won": string;
  "PMS Company ID": string;
  "PMS Company ID - Hubspot Company ID": string;
  "PMS Company ID - Name": string;
}

async function importCompanies() {
  // Use Pool directly to bypass Prisma client issues
  const { Pool } = await import("pg");
  
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log("Starting companies import...");
    console.log(`DATABASE_URL: ${process.env.DATABASE_URL?.substring(0, 20)}...`); // Log first 20 chars for debugging

    // Read the CSV file
    const csvFilePath = join(process.cwd(), "..", "imports", "Companies.csv");
    const fileContent = readFileSync(csvFilePath, "utf-8");

    // Parse CSV
    const records: CompanyRow[] = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`Found ${records.length} companies in CSV`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    // Process each record
    for (const record of records) {
      try {
        const companyName = record["Company name"]?.trim();
        const hubspotRecordId = record["Record ID"]?.trim();

        // Skip if no company name
        if (!companyName) {
          console.warn(`Skipping record with no company name: ${JSON.stringify(record)}`);
          skipped++;
          continue;
        }

        // Note: Duplicate checking is handled by database unique constraint on hubspotRecordId

        // Prepare website URL
        let website = record["Company Domain Name"]?.trim();
        if (website && !website.startsWith("http://") && !website.startsWith("https://")) {
          website = `https://${website}`;
        }

        // Create account using raw SQL
        const insertSQL = `
          INSERT INTO "Account" (id, name, website, industry, "hubspotRecordId", "createdAt", "updatedAt")
          VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW(), NOW())
          ON CONFLICT ("hubspotRecordId") DO NOTHING
        `;
        
        await pool.query(insertSQL, [
          companyName,
          website || null,
          record.Industry?.trim() || null,
          hubspotRecordId || null,
        ]);

        imported++;
        if (imported % 100 === 0) {
          console.log(`Imported ${imported} companies...`);
        }
      } catch (error: any) {
        // Check if it's a unique constraint violation (duplicate hubspotRecordId or name)
        if (error.code === "P2002" || error.message?.includes("Unique constraint")) {
          console.log(`Skipping duplicate: ${record["Company name"]}`);
          skipped++;
        } else {
          // Log full error for first few to debug
          if (errors < 3) {
            console.error(`Error importing company: ${record["Company name"]}`);
            console.error("Full error:", JSON.stringify(error, null, 2));
          } else {
            console.error(`Error importing company: ${record["Company name"]}`, error.message?.substring(0, 200));
          }
          errors++;
        }
      }
    }

    console.log("\n=== Import Summary ===");
    console.log(`Total records: ${records.length}`);
    console.log(`Imported: ${imported}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);
  } catch (error) {
    console.error("Import failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the import
importCompanies();
