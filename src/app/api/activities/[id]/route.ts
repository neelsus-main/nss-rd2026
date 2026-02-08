import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

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
    const { completed } = body;

    const activity = await prisma.activity.update({
      where: { id: params.id },
      data: {
        completed: completed === true,
        completedAt: completed === true ? new Date() : null,
      },
      include: {
        owner: true,
        account: true,
        contact: true,
        deal: true,
        lead: true,
      },
    });

    return NextResponse.json(activity);
  } catch (error) {
    console.error("Error updating activity:", error);
    return NextResponse.json(
      { error: "Failed to update activity" },
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

    await prisma.activity.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting activity:", error);
    return NextResponse.json(
      { error: "Failed to delete activity" },
      { status: 500 }
    );
  }
}
