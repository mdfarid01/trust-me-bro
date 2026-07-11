import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDueDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function emailShell(content: string) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0A0A0A;color:#FAFAFA;border-radius:12px">
      <h1 style="font-size:24px;font-weight:800;margin-bottom:8px">🤝 Trust Me Bro</h1>
      ${content}
    </div>
  `;
}

export async function sendAgreementCreatedEmail({
  toEmail,
  toName,
  fromName,
  amount,
  reason,
  dueDate,
  inviteLink,
}: {
  toEmail: string;
  toName: string;
  fromName: string;
  amount: number;
  reason: string;
  dueDate: string;
  inviteLink: string;
}) {
  const safeToName = escapeHtml(toName);
  const safeFromName = escapeHtml(fromName);
  const safeReason = escapeHtml(reason);

  await resend.emails.send({
    from: "Trust Me Bro <notifications@trustmebro.xyz>",
    to: toEmail,
    subject: `${fromName} wants to make an agreement with you`,
    html: emailShell(`
      <p style="color:#71717A;margin-bottom:24px;font-size:14px">Lending money, made transparent</p>
      <div style="background:#111111;border:1px solid #1F1F1F;border-radius:10px;padding:20px;margin-bottom:20px">
        <p style="margin:0 0 8px;font-size:16px">Hi ${safeToName}, <strong>${safeFromName}</strong> wants to make an agreement with you</p>
        <p style="margin:4px 0;color:#71717A;font-size:14px">Amount: <span style="color:#FAFAFA">₹${amount}</span></p>
        <p style="margin:4px 0;color:#71717A;font-size:14px">Reason: <span style="color:#FAFAFA">${safeReason}</span></p>
        <p style="margin:4px 0;color:#71717A;font-size:14px">Due: <span style="color:#FAFAFA">${formatDueDate(dueDate)}</span></p>
      </div>
      <a href="${escapeHtml(inviteLink)}" style="display:block;background:#22C55E;color:#000;text-align:center;padding:14px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">Accept Agreement →</a>
      <p style="margin-top:16px;font-size:12px;color:#3F3F46;text-align:center">Only accept if you know ${safeFromName} personally.</p>
    `),
  });
}

export async function sendAgreementAcceptedEmail({
  toEmail,
  toName,
  borrowerName,
  amount,
  reason,
}: {
  toEmail: string;
  toName: string;
  borrowerName: string;
  amount: number;
  reason: string;
}) {
  const safeToName = escapeHtml(toName);
  const safeBorrowerName = escapeHtml(borrowerName);
  const safeReason = escapeHtml(reason);

  await resend.emails.send({
    from: "Trust Me Bro <notifications@trustmebro.xyz>",
    to: toEmail,
    subject: `${borrowerName} accepted your agreement`,
    html: emailShell(`
      <div style="background:#111111;border:1px solid #1F1F1F;border-radius:10px;padding:20px;margin-bottom:20px">
        <p style="margin:0 0 8px;font-size:16px">Hi ${safeToName}, ✅ <strong>${safeBorrowerName}</strong> accepted your agreement</p>
        <p style="margin:4px 0;color:#71717A;font-size:14px">Amount: <span style="color:#FAFAFA">₹${amount}</span></p>
        <p style="margin:4px 0;color:#71717A;font-size:14px">Reason: <span style="color:#FAFAFA">${safeReason}</span></p>
      </div>
      <p style="font-size:14px;color:#71717A;text-align:center">The agreement is now active. You will be notified when repayment is made.</p>
    `),
  });
}

export async function sendRepaymentMarkedEmail({
  toEmail,
  toName,
  borrowerName,
  amount,
  reason,
  confirmLink,
}: {
  toEmail: string;
  toName: string;
  borrowerName: string;
  amount: number;
  reason: string;
  confirmLink: string;
}) {
  const safeToName = escapeHtml(toName);
  const safeBorrowerName = escapeHtml(borrowerName);
  const safeReason = escapeHtml(reason);

  await resend.emails.send({
    from: "Trust Me Bro <notifications@trustmebro.xyz>",
    to: toEmail,
    subject: `${borrowerName} marked the agreement as repaid`,
    html: emailShell(`
      <div style="background:#111111;border:1px solid #1F1F1F;border-radius:10px;padding:20px;margin-bottom:20px">
        <p style="margin:0 0 8px;font-size:16px">Hi ${safeToName}, 💰 <strong>${safeBorrowerName}</strong> says they repaid</p>
        <p style="margin:4px 0;color:#71717A;font-size:14px">Amount: <span style="color:#FAFAFA">₹${amount}</span></p>
        <p style="margin:4px 0;color:#71717A;font-size:14px">Reason: <span style="color:#FAFAFA">${safeReason}</span></p>
      </div>
      <p style="font-size:14px;color:#FAFAFA;margin-bottom:16px">Did you receive the money? Confirm to update their Trust Score.</p>
      <a href="${escapeHtml(confirmLink)}" style="display:block;background:#22C55E;color:#000;text-align:center;padding:14px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">Confirm Receipt →</a>
    `),
  });
}

export async function sendRepaymentConfirmedEmail({
  toEmail,
  toName,
  lenderName,
  amount,
  newTrustScore,
}: {
  toEmail: string;
  toName: string;
  lenderName: string;
  amount: number;
  newTrustScore: number;
}) {
  const safeToName = escapeHtml(toName);
  const safeLenderName = escapeHtml(lenderName);

  await resend.emails.send({
    from: "Trust Me Bro <notifications@trustmebro.xyz>",
    to: toEmail,
    subject: `${lenderName} confirmed your repayment`,
    html: emailShell(`
      <div style="background:#111111;border:1px solid #1F1F1F;border-radius:10px;padding:20px;margin-bottom:20px">
        <p style="margin:0 0 8px;font-size:16px">Hi ${safeToName}, 🎉 repayment confirmed by <strong>${safeLenderName}</strong></p>
        <p style="margin:4px 0;color:#71717A;font-size:14px">Amount: <span style="color:#FAFAFA">₹${amount}</span></p>
        <p style="margin:8px 0 0;font-size:16px">Your Trust Score: <span style="color:#22C55E;font-weight:800;font-size:24px">${newTrustScore}</span></p>
      </div>
      <p style="font-size:14px;color:#71717A;text-align:center">Keep it up! Every repayment builds your Trust Score.</p>
    `),
  });
}
