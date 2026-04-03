import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Zero Calendar <noreply@zerocalendar.app>";

interface SendInviteParams {
  acceptUrl: string;
  declineUrl: string;
  eventEnd: string;
  eventLocation?: string;
  eventStart: string;
  eventTitle: string;
  organizerName: string;
  toEmail: string;
}

export async function sendInviteEmail(params: SendInviteParams) {
  const {
    acceptUrl,
    declineUrl,
    eventEnd,
    eventLocation,
    eventStart,
    eventTitle,
    organizerName,
    toEmail,
  } = params;

  const startDate = new Date(eventStart);
  const endDate = new Date(eventEnd);

  const dateStr = startDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const timeStr = `${startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })} – ${endDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: `${organizerName} invited you: ${eventTitle}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#0a0a0c;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:40px auto;padding:0 20px;">
    <div style="background:#111114;border:1px solid rgba(255,255,255,0.08);border-radius:20px;overflow:hidden;">
      <div style="padding:32px 28px 24px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;">
          <div style="width:36px;height:36px;background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:10px;display:flex;align-items:center;justify-content:center;">
            <span style="color:#fff;font-size:16px;font-weight:700;">Z</span>
          </div>
          <span style="color:rgba(255,255,255,0.5);font-size:12px;font-weight:500;">Zero Calendar</span>
        </div>

        <h1 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px;">You're invited</h1>
        <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0 0 28px;line-height:1.5;">
          <strong style="color:rgba(255,255,255,0.85);">${organizerName}</strong> invited you to an event.
        </p>

        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:20px;">
          <h2 style="color:#fff;font-size:16px;font-weight:600;margin:0 0 14px;">${eventTitle}</h2>
          <div style="margin-bottom:8px;">
            <span style="color:rgba(255,255,255,0.35);font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">When</span>
            <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:4px 0 0;">${dateStr}<br/>${timeStr}</p>
          </div>
          ${
            eventLocation
              ? `<div style="margin-top:12px;">
            <span style="color:rgba(255,255,255,0.35);font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Where</span>
            <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:4px 0 0;">${eventLocation}</p>
          </div>`
              : ""
          }
        </div>
      </div>

      <div style="padding:0 28px 28px;">
        <div style="display:flex;gap:10px;">
          <a href="${acceptUrl}" style="flex:1;display:block;text-align:center;padding:12px 0;background:#fff;color:#000;font-size:13px;font-weight:600;text-decoration:none;border-radius:12px;">
            Accept
          </a>
          <a href="${declineUrl}" style="flex:1;display:block;text-align:center;padding:12px 0;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);font-size:13px;font-weight:500;text-decoration:none;border-radius:12px;">
            Decline
          </a>
        </div>
      </div>
    </div>

    <p style="color:rgba(255,255,255,0.2);font-size:11px;text-align:center;margin-top:20px;">
      Sent by Zero Calendar on behalf of ${organizerName}
    </p>
  </div>
</body>
</html>`,
  });

  if (error) {
    console.error("[resend] Failed to send invite:", error);
    throw new Error(`Failed to send invite to ${toEmail}: ${error.message}`);
  }
}
