import nodemailer from "nodemailer";

type ApplicationStatus = "pending" | "shortlisted" | "approved" | "denied";

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; color: string; bgColor: string; borderColor: string; icon: string; message: string }
> = {
  pending: {
    label: "Pending Review",
    color: "#6B7280",
    bgColor: "#F9FAFB",
    borderColor: "#D1D5DB",
    icon: "&#9203;",
    message:
      "Your application is currently under review. We will notify you once a decision has been made.",
  },
  shortlisted: {
    label: "Shortlisted",
    color: "#B45309",
    bgColor: "#FFFBEB",
    borderColor: "#FCD34D",
    icon: "&#11088;",
    message:
      "Congratulations! Your application has been shortlisted. The scholarship sponsor is further reviewing your profile.",
  },
  approved: {
    label: "Approved",
    color: "#15803D",
    bgColor: "#F0FDF4",
    borderColor: "#86EFAC",
    icon: "&#9989;",
    message:
      "Congratulations! Your scholarship application has been approved. You have been selected as a scholar!",
  },
  denied: {
    label: "Not Selected",
    color: "#B91C1C",
    bgColor: "#FFF1F2",
    borderColor: "#FCA5A5",
    icon: "&#10060;",
    message:
      "We regret to inform you that your application was not selected at this time. You are welcome to re-apply when eligible.",
  },
};

function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

export async function sendApplicationStatusEmail(params: {
  studentEmail: string;
  studentName: string;
  scholarshipTitle: string;
  sponsorName: string;
  status: ApplicationStatus;
  remarks?: string | null;
}): Promise<void> {
  const { studentEmail, studentName, scholarshipTitle, sponsorName, status, remarks } = params;
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

  const remarksHtml = remarks
    ? `
      <div style="margin-top:20px;padding:16px 20px;background-color:#F9FAFB;border-left:4px solid ${config.color};border-radius:0 6px 6px 0;">
        <p style="margin:0 0 6px 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#6B7280;">Message from Sponsor</p>
        <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">${remarks}</p>
      </div>`
    : "";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application Update — iSkolar</title>
</head>
<body style="margin:0;padding:0;background-color:#EEF2FF;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#EEF2FF;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation"
          style="background-color:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(58,82,166,0.12);max-width:600px;width:100%;">

          <!-- ── Header ── -->
          <tr>
            <td style="background-color:#3A52A6;padding:28px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <span style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:0.5px;">iSkolar</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Status Banner ── -->
          <tr>
            <td style="background-color:${config.bgColor};padding:28px 36px;text-align:center;border-bottom:3px solid ${config.borderColor};">
              <div style="font-size:40px;line-height:1;">${config.icon}</div>
              <h2 style="margin:12px 0 0 0;font-size:21px;font-weight:700;color:${config.color};">
                Application ${config.label}
              </h2>
            </td>
          </tr>

          <!-- ── Body ── -->
          <tr>
            <td style="padding:32px 36px;">
              <p style="margin:0 0 10px 0;font-size:16px;color:#111827;">
                Hi <strong>${studentName}</strong>,
              </p>
              <p style="margin:0 0 28px 0;font-size:15px;color:#4B5563;line-height:1.7;">
                ${config.message}
              </p>

              <!-- Scholarship Info Card -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                style="background-color:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;overflow:hidden;">
                <tr>
                  <td style="padding:18px 20px;border-bottom:1px solid #E5E7EB;">
                    <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.7px;color:#9CA3AF;">Scholarship</p>
                    <p style="margin:0;font-size:15px;font-weight:600;color:#111827;">${scholarshipTitle}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 20px;border-bottom:1px solid #E5E7EB;">
                    <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.7px;color:#9CA3AF;">Offered by</p>
                    <p style="margin:0;font-size:15px;color:#374151;">${sponsorName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 8px 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.7px;color:#9CA3AF;">Status</p>
                    <span style="display:inline-block;padding:5px 16px;background-color:${config.bgColor};color:${config.color};font-size:13px;font-weight:700;border-radius:999px;border:1.5px solid ${config.borderColor};">
                      ${config.label}
                    </span>
                  </td>
                </tr>
              </table>

              ${remarksHtml}

              <p style="margin:28px 0 0 0;font-size:13px;color:#9CA3AF;line-height:1.6;">
                Open the <strong style="color:#3A52A6;">iSkolar</strong> app to view your full application details and track all your scholarship progress.
              </p>
            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td style="background-color:#F9FAFB;padding:18px 36px;border-top:1px solid #E5E7EB;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9CA3AF;">
                This is an automated message from iSkolar. Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"iSkolar" <${process.env.EMAIL_USER}>`,
    to: studentEmail,
    subject: `Application Update: ${config.label} — ${scholarshipTitle}`,
    html,
  });
}
