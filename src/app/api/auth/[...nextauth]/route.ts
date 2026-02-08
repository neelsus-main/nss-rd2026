import { handlers } from "@/auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Wrap handlers with error handling
export async function GET(request: Request) {
  try {
    const handler = handlers.GET;
    return await handler(request);
  } catch (error) {
    console.error("NextAuth GET error:", error);
    return NextResponse.json(
      { error: "Authentication service error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const handler = handlers.POST;
    return await handler(request);
  } catch (error) {
    console.error("NextAuth POST error:", error);
    return NextResponse.json(
      { error: "Authentication service error" },
      { status: 500 }
    );
  }
}
