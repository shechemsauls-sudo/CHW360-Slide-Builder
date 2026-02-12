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
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      ${org ? `<p><strong>Organization:</strong> ${org}</p>` : ""}
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `,
  });

  // Send confirmation to submitter
  await resend.emails.send({
    from: FROM_EMAIL,
    to: submission.email,
    subject: "Thank you for contacting CHW360",
    html: `
      <h2>Thank you, ${name}!</h2>
      <p>We've received your message and will get back to you shortly.</p>
      <p>— The CHW360 Team</p>
    `,
  });
}
