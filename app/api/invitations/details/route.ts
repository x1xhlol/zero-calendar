import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/convex";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const client = getConvexClient();
    const invitation = await client.query(api.invitations.getByToken, {
      token,
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      eventTitle: invitation.eventTitle,
      eventStart: invitation.eventStart,
      eventEnd: invitation.eventEnd,
      eventLocation: invitation.eventLocation,
      organizerName: invitation.organizerName,
      status: invitation.status,
    });
  } catch (error) {
    console.error("[invitations/details] Error:", error);
    return NextResponse.json(
      { error: "Failed to load invitation" },
      { status: 500 }
    );
  }
}
