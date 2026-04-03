import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/lib/auth-server";
import { deleteEvent, updateEvent } from "@/lib/calendar";

interface RouteContext {
  params: Promise<{
    eventId: string;
  }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentAuthUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await context.params;
    const body = await request.json();

    if (body.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await updateEvent(user.id, eventId, {
      title: body.title,
      description: body.description,
      start: body.start,
      end: body.end,
      location: body.location,
      color: body.color,
      categoryId: body.category,
      categories: body.category ? [body.category] : undefined,
      allDay: body.allDay,
    });

    return NextResponse.json({ event });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentAuthUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await context.params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await deleteEvent(user.id, eventId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
