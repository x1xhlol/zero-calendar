import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/lib/auth-server";
import { createEvent, getEvents } from "@/lib/calendar";

export async function GET(request: Request) {
  try {
    const user = await getCurrentAuthUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (!(start && end)) {
      return NextResponse.json({ error: "Missing start/end" }, { status: 400 });
    }

    const events = await getEvents(user.id, start, end);
    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentAuthUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (body.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await createEvent({
      userId: user.id,
      title: body.title,
      description: body.description,
      start: body.start,
      end: body.end,
      location: body.location,
      color: body.color,
      categoryId: body.category,
      categories: body.category ? [body.category] : undefined,
      allDay: body.allDay ?? false,
      source: "local",
    });

    return NextResponse.json({ event });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
