import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        account: true,
        owner: true,
        contacts: {
          include: { contact: true },
        },
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

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    return NextResponse.json(deal);
  } catch (error) {
    console.error("Error fetching deal:", error);
    return NextResponse.json(
      { error: "Failed to fetch deal" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      name,
      amount,
      stage,
      probability,
      closeDate,
      accountId,
      hubspotRecordId,
    } = body;

    const deal = await prisma.deal.update({
      where: { id },
      data: {
        name,
        amount: amount ? parseFloat(amount) : undefined,
        stage,
        probability: probability ? parseInt(probability) : undefined,
        closeDate: closeDate ? new Date(closeDate) : null,
        hubspotRecordId: hubspotRecordId !== undefined ? hubspotRecordId : undefined,
        accountId: accountId || null,
      },
      include: {
        account: true,
        owner: true,
        contacts: {
          include: { contact: true },
        },
      },
    });

    return NextResponse.json(deal);
  } catch (error) {
    console.error("Error updating deal:", error);
    return NextResponse.json(
      { error: "Failed to update deal" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.deal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting deal:", error);
    return NextResponse.json(
      { error: "Failed to delete deal" },
      { status: 500 }
    );
  }
}
