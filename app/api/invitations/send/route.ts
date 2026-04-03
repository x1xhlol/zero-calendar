import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { getCurrentAuthUser } from "@/lib/auth-server";
import { getConvexClient } from "@/lib/convex";
import { sendInviteEmail } from "@/lib/resend";

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentAuthUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      eventId,
      eventTitle,
      eventStart,
      eventEnd,
      eventLocation,
      eventCalendarId,
      invitees,
    } = body as {
      eventCalendarId?: string;
      eventEnd: string;
      eventId: string;
      eventLocation?: string;
      eventStart: string;
      eventTitle: string;
      invitees: string[];
    };

    if (!(eventId && eventTitle && invitees?.length)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = getConvexClient();
    const siteUrl = getSiteUrl();
    const results: { email: string; status: string; token?: string }[] = [];

    for (const email of invitees) {
      const existing = await client.query(
        api.invitations.getByEventAndInvitee,
        { eventId, inviteeEmail: email }
      );

      if (existing) {
        results.push({ email, status: "already_invited" });
        continue;
      }

      const token = nanoid(32);

      await client.mutation(api.invitations.create, {
        token,
        eventId,
        organizerUserId: user.id,
        organizerName: user.name || user.email || "Someone",
        organizerEmail: user.email || "",
        inviteeEmail: email,
        eventTitle,
        eventStart,
        eventEnd,
        eventLocation,
        eventCalendarId,
        status: "pending",
        createdAt: Date.now(),
      });

      try {
        await sendInviteEmail({
          toEmail: email,
          organizerName: user.name || user.email || "Someone",
          eventTitle,
          eventStart,
          eventEnd,
          eventLocation,
          acceptUrl: `${siteUrl}/invite/${token}?action=accept`,
          declineUrl: `${siteUrl}/invite/${token}?action=decline`,
        });

        results.push({ email, status: "sent", token });
      } catch (error) {
        console.error(`[invitations] Failed to email ${email}:`, error);
        results.push({ email, status: "email_failed" });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[invitations] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
