import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const ADMIN_EMAIL = "matt@miraclemind.dev";
const FROM_EMAIL = "CHW360 <noreply@miraclemind.dev>";

export async function sendContactNotification(submission: {
  name: string;
  email: string;
  organization?: string | null;
  message: string;
}) {
  // Notify admin
  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `New CHW360 Contact: ${submission.name}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${submission.name}</p>
      <p><strong>Email:</strong> ${submission.email}</p>
      ${submission.organization ? `<p><strong>Organization:</strong> ${submission.organization}</p>` : ""}
      <p><strong>Message:</strong></p>
      <p>${submission.message}</p>
    `,
  });

  // Send confirmation to submitter
  await resend.emails.send({
    from: FROM_EMAIL,
    to: submission.email,
    subject: "Thank you for contacting CHW360",
    html: `
      <h2>Thank you, ${submission.name}!</h2>
      <p>We've received your message and will get back to you shortly.</p>
      <p>— The CHW360 Team</p>
    `,
  });
}
