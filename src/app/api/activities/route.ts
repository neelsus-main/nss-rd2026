import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const activities = await prisma.activity.findMany({
      include: {
        owner: true,
        account: true,
        contact: true,
        deal: true,
        lead: true,
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
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
      type,
      subject,
      description,
      dueDate,
      accountId,
      contactId,
      dealId,
      leadId,
    } = body;

    if (!type || !subject) {
      return NextResponse.json(
        { error: "Activity type and subject are required" },
        { status: 400 }
      );
    }

    const activity = await prisma.activity.create({
      data: {
        type,
        subject,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        accountId: accountId || null,
        contactId: contactId || null,
        dealId: dealId || null,
        leadId: leadId || null,
        ownerId: session.user.id,
      },
      include: {
        owner: true,
        account: true,
        contact: true,
        deal: true,
        lead: true,
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 }
    );
  }
}
