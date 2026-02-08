// Load environment variables FIRST before any other imports
import { config } from "dotenv";
import { resolve } from "path";

// Try to load .env file, but also allow DATABASE_URL from environment
config({ path: resolve(process.cwd(), ".env") });

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL environment variable is not set.");
  process.exit(1);
}

import { readFileSync } from "fs";
import { join } from "path";

async function applyMigration() {
  // Dynamic import of prisma after env vars are loaded
  const prismaModule = await import("../src/lib/prisma");
  const prisma = prismaModule.default;

  try {
    console.log("Applying migration to add hubspotRecordId columns...");

    // Read the migration SQL file
    const migrationPath = join(process.cwd(), "prisma", "migrations", "20260209_add_hubspot_record_id", "migration.sql");
    const migrationSQL = readFileSync(migrationPath, "utf-8");

    // Split SQL into individual statements and execute them
    const statements = migrationSQL
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await prisma.$executeRawUnsafe(statement);
          console.log(`✅ Executed: ${statement.substring(0, 50)}...`);
        } catch (error: any) {
          // Ignore if column/index already exists
          if (error.message?.includes("already exists") || error.message?.includes("duplicate")) {
            console.log(`⚠️  Skipped (already exists): ${statement.substring(0, 50)}...`);
          } else {
            throw error;
          }
        }
      }
    }

    console.log("✅ Migration applied successfully!");
  } catch (error: any) {
    // Check if columns already exist
    if (error.message?.includes("already exists") || error.message?.includes("duplicate")) {
      console.log("⚠️  Migration already applied (columns may already exist)");
    } else {
      console.error("Migration failed:", error.message);
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
applyMigration();
