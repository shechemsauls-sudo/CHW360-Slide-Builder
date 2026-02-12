import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "matt@miraclemind.dev";
const FROM_EMAIL = "CHW360 <noreply@miraclemind.dev>";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function brandedEmailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F5EDE6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5EDE6;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <!-- Header -->
          <tr>
            <td style="background-color:#2D5A5A;padding:20px 24px;border-radius:12px 12px 0 0;">
              <span style="font-size:22px;color:#FFFFFF;font-weight:600;letter-spacing:-0.5px;">CHW</span><span style="font-size:22px;color:rgba(255,255,255,0.8);font-weight:300;">360</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#FFFFFF;padding:32px 24px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#FAF7F4;padding:16px 24px;border-radius:0 0 12px 12px;border-top:1px solid #E8E4E0;">
              <p style="margin:0;font-size:12px;color:#6B7280;text-align:center;">
                CHW360 | info@chw360.org
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendContactNotification(submission: {
  name: string;
  email: string;
  organization?: string | null;
  message: string;
}) {
  const name = escapeHtml(submission.name);
  const email = escapeHtml(submission.email);
  const org = submission.organization ? escapeHtml(submission.organization) : null;
  const message = escapeHtml(submission.message);

  // Notify admin
  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `New CHW360 Contact: ${submission.name}`,
    html: brandedEmailWrapper(`
      <h2 style="margin:0 0 16px;font-size:20px;color:#2D5A5A;">New Contact Form Submission</h2>
      <p style="margin:0 0 8px;font-size:14px;color:#4A5568;"><strong>Name:</strong> ${name}</p>
      <p style="margin:0 0 8px;font-size:14px;color:#4A5568;"><strong>Email:</strong> ${email}</p>
      ${org ? `<p style="margin:0 0 8px;font-size:14px;color:#4A5568;"><strong>Organization:</strong> ${org}</p>` : ""}
      <p style="margin:0 0 8px;font-size:14px;color:#4A5568;"><strong>Message:</strong></p>
      <p style="margin:0;font-size:14px;color:#4A5568;">${message}</p>
    `),
  });

  // Send confirmation to submitter
  await resend.emails.send({
    from: FROM_EMAIL,
    to: submission.email,
    subject: "Thank you for contacting CHW360",
    html: brandedEmailWrapper(`
      <h2 style="margin:0 0 16px;font-size:20px;color:#2D5A5A;">Thank you, ${name}!</h2>
      <p style="margin:0 0 12px;font-size:14px;color:#4A5568;line-height:1.6;">
        We've received your message and will get back to you shortly.
      </p>
      <p style="margin:0;font-size:14px;color:#4A5568;">— The CHW360 Team</p>
    `),
  });
}

export async function sendClaimEmail(email: string, magicLink: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "You've been invited to CHW360",
    html: brandedEmailWrapper(`
      <h2 style="margin:0 0 16px;font-size:20px;color:#2D5A5A;">Welcome to CHW360</h2>
      <p style="margin:0 0 20px;font-size:14px;color:#4A5568;line-height:1.6;">
        You've been invited to join CHW360. Click the button below to claim your account and get started.
      </p>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
        <tr>
          <td style="background-color:#C9725B;border-radius:9999px;">
            <a href="${escapeHtml(magicLink)}" style="display:inline-block;padding:12px 32px;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;">
              Claim Your Account
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 8px;font-size:12px;color:#6B7280;line-height:1.5;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <p style="margin:0;font-size:12px;color:#C9725B;word-break:break-all;">
        ${escapeHtml(magicLink)}
      </p>
    `),
  });
}
