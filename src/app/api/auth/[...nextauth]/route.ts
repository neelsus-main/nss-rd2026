import { handlers } from "@/auth";

export const { GET, POST } = handlers;

// Add runtime config for better error handling
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
