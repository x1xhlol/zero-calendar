"use client";

import {
  CheckCircleIcon,
  ClockIcon,
  LoaderIcon,
  MapPinIcon,
  XCircleIcon,
} from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type InviteState = "loading" | "ready" | "responding" | "done" | "error";
type InviteStatus = "pending" | "accepted" | "declined";

interface InviteData {
  eventEnd: string;
  eventLocation?: string;
  eventStart: string;
  eventTitle: string;
  organizerName: string;
  status: InviteStatus;
}

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const token = params.token;

  const [state, setState] = useState<InviteState>("loading");
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [responseStatus, setResponseStatus] = useState<InviteStatus>("pending");

  useEffect(() => {
    if (!token) {
      return;
    }

    fetch(`/api/invitations/details?token=${token}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        setInvite(data);

        if (data.status !== "pending") {
          setResponseStatus(data.status);
          setResponseMessage(
            data.status === "accepted"
              ? "You already accepted this invitation."
              : "You already declined this invitation."
          );
          setState("done");
          return;
        }

        const autoAction = searchParams.get("action");
        if (autoAction === "accept" || autoAction === "decline") {
          respond(autoAction, data);
        } else {
          setState("ready");
        }
      })
      .catch(() => {
        setState("error");
      });
  }, [token, searchParams]);

  const respond = useCallback(
    async (action: "accept" | "decline", inviteOverride?: InviteData) => {
      setState("responding");

      try {
        const res = await fetch("/api/invitations/respond", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, action }),
        });

        if (!res.ok) {
          throw new Error("Failed");
        }

        const data = await res.json();
        setResponseStatus(data.status);
        setResponseMessage(data.message);
        setState("done");

        if (inviteOverride) {
          setInvite(inviteOverride);
        }
      } catch {
        setState("error");
      }
    },
    [token]
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (start: string, end: string) => {
    return `${new Date(start).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })} – ${new Date(end).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#0a0a0c] p-4">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#111114]">
          <div className="border-white/[0.06] border-b px-6 py-5">
            <p className="font-medium text-[13px] text-white/50 tracking-tight">
              Zero Calendar
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {state === "loading" && (
              <div className="flex flex-col items-center gap-3 py-12">
                <LoaderIcon className="h-6 w-6 animate-spin text-white/40" />
                <p className="text-sm text-white/50">Loading invitation...</p>
              </div>
            )}

            {state === "error" && (
              <div className="flex flex-col items-center gap-3 py-12">
                <XCircleIcon className="h-8 w-8 text-red-400" />
                <p className="font-medium text-sm text-white/80">
                  Invalid or expired invitation
                </p>
                <p className="text-white/40 text-xs">
                  This invite link may no longer be valid.
                </p>
              </div>
            )}

            {(state === "ready" || state === "responding") && invite && (
              <>
                <p className="mb-1 text-white/40 text-xs">
                  <strong className="text-white/70">
                    {invite.organizerName}
                  </strong>{" "}
                  invited you to:
                </p>
                <h1 className="mb-5 font-bold text-white text-xl">
                  {invite.eventTitle}
                </h1>

                <div className="mb-6 space-y-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <div className="flex items-start gap-3">
                    <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-white/30" />
                    <div>
                      <p className="text-sm text-white/80">
                        {formatDate(invite.eventStart)}
                      </p>
                      <p className="text-white/50 text-xs">
                        {formatTime(invite.eventStart, invite.eventEnd)}
                      </p>
                    </div>
                  </div>
                  {invite.eventLocation && (
                    <div className="flex items-start gap-3">
                      <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-white/30" />
                      <p className="text-sm text-white/80">
                        {invite.eventLocation}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-white font-semibold text-black text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                    disabled={state === "responding"}
                    onClick={() => respond("accept")}
                  >
                    {state === "responding" ? (
                      <LoaderIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircleIcon className="h-4 w-4" />
                    )}
                    Accept
                  </button>
                  <button
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] font-medium text-sm text-white/70 transition-colors hover:bg-white/[0.08] disabled:opacity-50"
                    disabled={state === "responding"}
                    onClick={() => respond("decline")}
                  >
                    <XCircleIcon className="h-4 w-4" />
                    Decline
                  </button>
                </div>
              </>
            )}

            {state === "done" && (
              <div className="flex flex-col items-center gap-4 py-8">
                {responseStatus === "accepted" ? (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30">
                    <CheckCircleIcon className="h-7 w-7 text-emerald-400" />
                  </div>
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 ring-1 ring-red-500/30">
                    <XCircleIcon className="h-7 w-7 text-red-400" />
                  </div>
                )}

                <div className="text-center">
                  <h2 className="font-bold text-lg text-white">
                    {responseStatus === "accepted"
                      ? "You're in!"
                      : "Invitation declined"}
                  </h2>
                  <p className="mt-1 text-sm text-white/50">
                    {responseMessage}
                  </p>
                </div>

                {invite && (
                  <div className="mt-2 w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                    <p className="font-medium text-sm text-white/80">
                      {invite.eventTitle}
                    </p>
                    <p className="mt-1 text-white/40 text-xs">
                      {formatDate(invite.eventStart)} &middot;{" "}
                      {formatTime(invite.eventStart, invite.eventEnd)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-white/20">
          Powered by Zero Calendar
        </p>
      </div>
    </div>
  );
}
