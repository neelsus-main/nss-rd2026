import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deals = await prisma.deal.findMany({
      include: {
        account: true,
        owner: true,
        contacts: {
          include: { contact: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(deals);
  } catch (error) {
    console.error("Error fetching deals:", error);
    return NextResponse.json(
      { error: "Failed to fetch deals" },
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
      amount,
      stage,
      probability,
      closeDate,
      accountId,
      contactIds,
      hubspotRecordId,
    } = body;

    if (!name || !amount) {
      return NextResponse.json(
        { error: "Deal name and amount are required" },
        { status: 400 }
      );
    }

    const deal = await prisma.deal.create({
      data: {
        name,
        amount: parseFloat(amount),
        stage: stage || "Prospecting",
        probability: probability ? parseInt(probability) : 0,
        closeDate: closeDate ? new Date(closeDate) : null,
        hubspotRecordId: hubspotRecordId || null,
        accountId: accountId || null,
        ownerId: session.user.id,
        contacts: contactIds
          ? {
              create: contactIds.map((contactId: string) => ({
                contactId,
              })),
            }
          : undefined,
      },
      include: {
        account: true,
        owner: true,
        contacts: {
          include: { contact: true },
        },
      },
    });

    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    console.error("Error creating deal:", error);
    return NextResponse.json(
      { error: "Failed to create deal" },
      { status: 500 }
    );
  }
}
