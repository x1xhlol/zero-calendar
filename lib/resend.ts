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

  const locationBlock = eventLocation
    ? `<tr>
        <td style="padding-top:16px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;">Where</p>
          <p style="margin:0;font-size:14px;color:#e0e0e0;line-height:1.5;">${eventLocation}</p>
        </td>
      </tr>`
    : "";

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: `${organizerName} invited you: ${eventTitle}`,
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Event Invitation</title>
</head>
<body style="margin:0;padding:0;background-color:#09090b;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#09090b;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;width:100%;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size:13px;font-weight:500;color:#71717a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                    Zero Calendar
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#18181b;border:1px solid #27272a;border-radius:16px;">

                <!-- Header -->
                <tr>
                  <td style="padding:32px 32px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                    <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#fafafa;">You&rsquo;re invited</h1>
                    <p style="margin:0;font-size:14px;color:#a1a1aa;line-height:1.5;">
                      <strong style="color:#e4e4e7;">${organizerName}</strong> invited you to an event.
                    </p>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding:24px 32px 0;">
                    <div style="height:1px;background-color:#27272a;"></div>
                  </td>
                </tr>

                <!-- Event details -->
                <tr>
                  <td style="padding:24px 32px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td>
                          <h2 style="margin:0 0 16px;font-size:17px;font-weight:600;color:#fafafa;">${eventTitle}</h2>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.06em;">When</p>
                          <p style="margin:0;font-size:14px;color:#e0e0e0;line-height:1.5;">${dateStr}<br/>${timeStr}</p>
                        </td>
                      </tr>
                      ${locationBlock}
                    </table>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding:24px 32px 0;">
                    <div style="height:1px;background-color:#27272a;"></div>
                  </td>
                </tr>

                <!-- Buttons -->
                <tr>
                  <td style="padding:24px 32px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="48%" align="center">
                          <a href="${acceptUrl}" target="_blank" style="display:inline-block;width:100%;padding:12px 0;background-color:#fafafa;color:#09090b;font-size:14px;font-weight:600;text-decoration:none;text-align:center;border-radius:10px;-webkit-border-radius:10px;mso-padding-alt:12px 0;">
                            Accept
                          </a>
                        </td>
                        <td width="4%"></td>
                        <td width="48%" align="center">
                          <a href="${declineUrl}" target="_blank" style="display:inline-block;width:100%;padding:12px 0;background-color:transparent;color:#a1a1aa;font-size:14px;font-weight:500;text-decoration:none;text-align:center;border:1px solid #3f3f46;border-radius:10px;-webkit-border-radius:10px;mso-padding-alt:12px 0;">
                            Decline
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              <p style="margin:0;font-size:12px;color:#52525b;line-height:1.5;">
                Sent via Zero Calendar on behalf of ${organizerName}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });

  if (error) {
    console.error("[resend] Failed to send invite:", error);
    throw new Error(`Failed to send invite to ${toEmail}: ${error.message}`);
  }
}
