import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { getEvent, updateEvent } from "@/lib/calendar";
import { syncUpdatedEventToGoogle } from "@/lib/calendar-google-sync-server";
import { getConvexClient } from "@/lib/convex";

export async function POST(request: Request) {
  try {
    const { token, action } = (await request.json()) as {
      action: "accept" | "decline";
      token: string;
    };

    if (!(token && ["accept", "decline"].includes(action))) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
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

    if (invitation.status !== "pending") {
      return NextResponse.json({
        status: invitation.status,
        message: `This invitation was already ${invitation.status}.`,
        alreadyResponded: true,
      });
    }

    const newStatus = action === "accept" ? "accepted" : "declined";

    await client.mutation(api.invitations.updateStatus, {
      token,
      status: newStatus,
      respondedAt: Date.now(),
    });

    if (action === "accept") {
      const existingEvent = await getEvent(
        invitation.organizerUserId,
        invitation.eventId
      );

      if (existingEvent) {
        const currentAttendees = existingEvent.attendees || [];
        const alreadyExists = currentAttendees.some(
          (a) => a.email.toLowerCase() === invitation.inviteeEmail.toLowerCase()
        );

        const updatedAttendees = alreadyExists
          ? currentAttendees.map((a) =>
              a.email.toLowerCase() === invitation.inviteeEmail.toLowerCase()
                ? { ...a, status: "accepted" as const }
                : a
            )
          : [
              ...currentAttendees,
              { email: invitation.inviteeEmail, status: "accepted" as const },
            ];

        const updatedEvent = await updateEvent(
          invitation.organizerUserId,
          invitation.eventId,
          { attendees: updatedAttendees }
        );

        await syncUpdatedEventToGoogle(
          invitation.organizerUserId,
          existingEvent,
          updatedEvent
        );
      }
    }

    return NextResponse.json({
      status: newStatus,
      message:
        action === "accept"
          ? "You've been added to the event!"
          : "You've declined the invitation.",
    });
  } catch (error) {
    console.error("[invitations/respond] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
