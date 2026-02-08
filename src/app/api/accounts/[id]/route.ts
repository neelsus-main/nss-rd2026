import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await prisma.account.findUnique({
      where: { id: params.id },
      include: {
        owner: true,
        contacts: true,
        deals: true,
        activities: {
          include: { owner: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        notes: {
          include: { owner: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error("Error fetching account:", error);
    return NextResponse.json(
      { error: "Failed to fetch account" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      ownerId,
    } = body;

    const account = await prisma.account.update({
      where: { id: params.id },
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
        ownerId: ownerId || session.user.id,
      },
      include: {
        owner: true,
      },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error("Error updating account:", error);
    return NextResponse.json(
      { error: "Failed to update account" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.account.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
