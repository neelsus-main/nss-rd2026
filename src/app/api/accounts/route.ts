import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accounts = await prisma.account.findMany({
      include: {
        owner: true,
        _count: {
          select: { contacts: true, deals: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      website,
      industry,
      phone,
      email,
      billingStreet,
      billingCity,
      billingState,
      billingZip,
      billingCountry,
      description,
      annualRevenue,
      employeeCount,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Account name is required" },
        { status: 400 }
      );
    }

    const account = await prisma.account.create({
      data: {
        name,
        website,
        industry,
        phone,
        email,
        billingStreet,
        billingCity,
        billingState,
        billingZip,
        billingCountry,
        description,
        annualRevenue: annualRevenue ? parseFloat(annualRevenue) : null,
        employeeCount: employeeCount ? parseInt(employeeCount) : null,
        ownerId: session.user.id,
      },
      include: {
        owner: true,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
